import type { SongRead } from "@/api/openapi"
import {
    type PlaybackEngine,
    type PlaybackEngineEnqueueOptions,
    type PlaybackEngineEvent,
    type PlaybackEngineEventDetail,
    type PlaybackEngineState,
    createPlaybackEngineEvent,
} from "@/playback/engine"
import type PlaybackEngineRegistry from "@/playback/engine-registry"
import { Queue, type QueueEntry } from "@/playback/queue"

export interface ReplaceQueueOptions
    extends Omit<PlaybackEngineEnqueueOptions<SongRead>, "itemToPlay"> {
    readonly newQueue: Queue<SongRead>
    readonly startingItem?: SongRead
}

export class Player {
    private readonly _engineRegistry: PlaybackEngineRegistry<SongRead>
    private readonly _eventTarget: EventTarget
    private _activeEngine: PlaybackEngine<SongRead> | null
    private _engineEventSink: (event: PlaybackEngineEvent<SongRead>) => void
    private _queue: Queue<SongRead>
    private _playingEntry: QueueEntry<SongRead> | null

    constructor(engineRegistry: PlaybackEngineRegistry<SongRead>) {
        this._engineRegistry = engineRegistry
        this._eventTarget = new EventTarget()
        this._activeEngine = null
        this._engineEventSink = (e) => this._handleEngineEvent(e)
        this._queue = new Queue()
        this._playingEntry = null
    }

    private _dispatchEvent(detail: PlaybackEngineEventDetail<SongRead>) {
        this._eventTarget.dispatchEvent(
            createPlaybackEngineEvent("onPlayerEvent", detail),
        )
    }

    private _changeEngine(newEngine: PlaybackEngine<SongRead> | null) {
        if (this._activeEngine === newEngine) {
            return
        }
        if (this._activeEngine !== null) {
            this._activeEngine.stop()
            this._activeEngine.removeEventListener(this._engineEventSink)
        }
        this._activeEngine = newEngine
        if (newEngine !== null) {
            newEngine.addEventListener(this._engineEventSink)
        }
    }

    private async _playEntry(
        entry: QueueEntry<SongRead>,
        options: Omit<PlaybackEngineEnqueueOptions<SongRead>, "itemToPlay">,
    ): Promise<void> {
        const engine = await this._engineRegistry.findPlaybackEngineFor(
            entry.item,
        )
        if (engine === null) {
            return // TODO: handle error
        }
        this._changeEngine(engine)
        this._playingEntry = entry
        await engine.enqueue({
            itemToPlay: entry.item,
            ...options,
        })
    }

    private async _handleEngineEvent(
        event: PlaybackEngineEvent<SongRead>,
    ): Promise<void> {
        switch (event.detail.type) {
            case "playbackStateDidChange":
            case "playingItemChanged":
            case "encounteredError":
                this._dispatchEvent(event.detail)
                break
            case "endOfAudio": {
                if (this._playingEntry === null) {
                    return
                }
                const nextEntry = await this._queue.entryFollowing(
                    this._playingEntry,
                )
                if (nextEntry === null) {
                    await this.stop()
                    this._dispatchEvent(event.detail)
                    return
                }
                await this._playEntry(nextEntry, { playNow: true })
                break
            }
        }
    }

    get playingEntry(): QueueEntry<SongRead> | null {
        return this._playingEntry
    }

    get playbackState(): PlaybackEngineState {
        if (this._activeEngine !== null) {
            return this._activeEngine.playbackState
        } else {
            return "stopped"
        }
    }

    get totalTime(): number | null {
        if (this._activeEngine !== null) {
            return this._activeEngine.totalTime
        } else {
            return null
        }
    }

    get currentTime(): number | null {
        if (this._activeEngine !== null) {
            return this._activeEngine.currentTime
        } else {
            return null
        }
    }

    get queue(): Queue<SongRead> {
        return this._queue
    }

    async replaceQueue({
        newQueue,
        startingItem,
        ...options
    }: ReplaceQueueOptions): Promise<void> {
        await this._activeEngine?.stop()

        this._queue = newQueue
        const startingEntry = startingItem
            ? await newQueue.entryForItem(startingItem)
            : await newQueue.firstEntry()
        if (startingEntry === null) {
            return // shrug
        }
        await this._playEntry(startingEntry, options)
    }

    async skipPrevious(): Promise<boolean> {
        const currentTime = this.currentTime
        if (currentTime !== null && currentTime > 10) {
            await this.seek(0)
            return true
        }
        if (this._playingEntry === null) {
            const firstEntry = await this._queue.firstEntry()
            if (firstEntry !== null) {
                await this._playEntry(firstEntry, { playNow: true })
                return true
            }
            return false
        } else {
            const previousEntry = await this._queue.entryPreceding(
                this._playingEntry,
            )
            if (previousEntry === null) {
                await this.stop()
                return false
            }
            await this._playEntry(previousEntry, { playNow: true })
            return true
        }
    }

    async skipNext(): Promise<boolean> {
        if (this._playingEntry === null) {
            const firstEntry = await this._queue.firstEntry()
            if (firstEntry !== null) {
                await this._playEntry(firstEntry, { playNow: true })
                return true
            }
            return false
        } else {
            const followingEntry = await this._queue.entryFollowing(
                this._playingEntry,
            )
            if (followingEntry === null) {
                await this.stop()
                return false
            }
            await this._playEntry(followingEntry, { playNow: true })
            return true
        }
    }

    async seek(newTime: number): Promise<void> {
        await this._activeEngine?.seek(newTime)
    }

    async pause(): Promise<void> {
        await this._activeEngine?.pause()
    }

    async resume(): Promise<void> {
        await this._activeEngine?.resume()
    }

    async stop(): Promise<void> {
        this._playingEntry = null
        await this._activeEngine?.stop()
    }

    addEventListener(
        callback: (event: PlaybackEngineEvent<SongRead>) => void,
    ): void {
        this._eventTarget.addEventListener(
            "onPlayerEvent",
            callback as EventListenerOrEventListenerObject,
        )
    }

    removeEventListener(
        callback: (event: PlaybackEngineEvent<SongRead>) => void,
    ): void {
        this._eventTarget.removeEventListener(
            "onPlayerEvent",
            callback as EventListenerOrEventListenerObject,
        )
    }
}
