import type { API, IngestPlaybackEvent } from "@magritte/api"
import { openDB, type DBSchema, type IDBPDatabase } from "idb"

import type { Player, PlayerEvent } from "@/playback/player"

interface PlaybackEventRecorderDB extends DBSchema {
    "playback-events": {
        key: number
        value: IngestPlaybackEvent
        indexes: { "by-recorded-at": Date }
    }
}

export interface PlaybackEventRecorderOptions {
    readonly api: API
}

export class PlaybackEventRecorder {
    private readonly db: IDBPDatabase<PlaybackEventRecorderDB>
    private readonly api: API
    private pendingFlush: Promise<number> | null
    private flushLaterTimeout: ReturnType<typeof setTimeout> | null

    static async open(options: PlaybackEventRecorderOptions): Promise<PlaybackEventRecorder> {
        const db = await openDB<PlaybackEventRecorderDB>("playback-events", 1, {
            upgrade(db) {
                const playbackEventsStore = db.createObjectStore("playback-events", {
                    autoIncrement: true,
                })
                playbackEventsStore.createIndex(
                    "by-recorded-at",
                    "recorded_at" satisfies keyof PlaybackEventRecorderDB["playback-events"]["value"],
                )
            },
        })
        return new PlaybackEventRecorder(db, options)
    }

    private constructor(
        db: IDBPDatabase<PlaybackEventRecorderDB>,
        options: PlaybackEventRecorderOptions,
    ) {
        this.db = db
        this.api = options.api
        this.pendingFlush = null
        this.flushLaterTimeout = null
    }

    get hasEnqueuedEvents(): Promise<boolean> {
        return (async () => {
            return (await this.db.count("playback-events")) > 0
        })()
    }

    /**
     * Enqueue playback events for ingestion by the API.
     *
     * @param playbackEvents The playback events to enqueue.
     */
    async enqueue(...playbackEvents: readonly IngestPlaybackEvent[]): Promise<void> {
        const tx = this.db.transaction("playback-events", "readwrite")
        for (const playbackEvent of playbackEvents) {
            await tx.store.put(playbackEvent)
        }
        await tx.done
    }

    /**
     * Flush a single batch of enqueued playback events.
     *
     * @returns The number of flushed playback events
     * @throws If the playback events cannot be ingested.
     * Any dequeued events will be re-inserted at the end.
     */
    private async _flushBatch(): Promise<number> {
        const tx = this.db.transaction("playback-events", "readwrite")
        const toIngest: IngestPlaybackEvent[] = []
        for await (const cursor of tx.store.iterate()) {
            toIngest.push(cursor.value)
            await cursor.delete()
            if (toIngest.length === 100) {
                break
            }
        }
        await tx.done

        if (toIngest.length > 0) {
            try {
                const result = await this.api.client.ingestPlaybackEvents(toIngest)
                console.info(
                    `Flushed ${result.accepted_count} playback events, rejected: `,
                    result.rejected_events,
                )
            } catch (error) {
                console.error("*** Could not flush playback events: ", error)
                await this.enqueue(...toIngest)
                throw error
            }
        }

        return toIngest.length
    }

    /**
     * Flush all enqueued playback events.
     *
     * @returns The number of flushed playback events.
     */
    async flush(): Promise<number> {
        if (this.pendingFlush === null) {
            this.pendingFlush = (async () => {
                try {
                    let flushed = 0
                    while (await this.hasEnqueuedEvents) {
                        flushed += await this._flushBatch()
                    }
                    return flushed
                } finally {
                    this.pendingFlush = null
                }
            })()
        }
        return this.pendingFlush
    }

    cancelFlushLater(): void {
        if (this.flushLaterTimeout !== null) {
            clearTimeout(this.flushLaterTimeout)
            this.flushLaterTimeout = null
        }
    }

    flushLater(): void {
        this.cancelFlushLater()
        this.flushLaterTimeout = setTimeout(() => {
            this.flushLaterTimeout = null
            this.flush()
        }, 30_000)
    }

    private async _handlePlayerEvent(player: Player, event: PlayerEvent) {
        switch (event.type) {
            case "playbackStateDidChange":
                if (player.playingItem !== null && typeof player.playingItem.id === "number") {
                    const now = new Date().toISOString()
                    const currentTime = await player.getCurrentTime()
                    const elapsedTime = currentTime.elapsedTime ?? 0
                    switch (event.playbackState) {
                        case "paused":
                            this.enqueue({
                                recorded_at: now,
                                kind: "pause",
                                song_id: player.playingItem.id,
                                start_time: elapsedTime,
                                end_time: elapsedTime,
                            })
                            break
                        case "playing":
                            this.enqueue({
                                recorded_at: now,
                                kind: "play",
                                song_id: player.playingItem.id,
                                start_time: elapsedTime,
                                end_time: elapsedTime,
                            })
                            break
                        case "stopped":
                            this.enqueue({
                                recorded_at: now,
                                kind: "stop",
                                song_id: player.playingItem.id,
                                start_time: elapsedTime,
                                end_time: elapsedTime,
                            })
                            break
                    }
                    this.flushLater()
                }
                break
            case "endOfAudio":
                if (event.lastItem !== null && typeof event.lastItem.id === "number") {
                    this.enqueue({
                        recorded_at: new Date().toISOString(),
                        kind: "stop",
                        song_id: event.lastItem.id,
                        start_time: event.lastItem.end_time,
                        end_time: event.lastItem.end_time,
                    })
                }
                break
            default:
                break
        }
    }

    wireUpPlayer(player: Player) {
        player.$events.subscribe((event) => this._handlePlayerEvent(player, event))
    }
}
