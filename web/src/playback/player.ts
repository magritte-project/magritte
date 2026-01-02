import type {
    PlaybackEngine,
    PlaybackEngineEnqueueOptions,
    PlaybackEngineEvent,
    PlaybackEngineState,
} from "@/playback/engine"
import type PlaybackEngineRegistry from "@/playback/engineRegistry"
import { Queue, type QueueEntry } from "@/playback/queue"
import {
    type EventSink,
    type EventStream,
    type EventSubscription,
    createEvent,
} from "@/utilities/events"
import type { PlayableItem } from "@/playback/item"

export type PlayerEvent = PlaybackEngineEvent | { type: "queueDidChange" }

export interface ReplaceQueueOptions
    extends Omit<PlaybackEngineEnqueueOptions, "itemToPlay"> {
    readonly newQueue: Queue<PlayableItem>
    readonly startingItem?: PlayableItem
}

export class Player {
    private readonly _engineRegistry: PlaybackEngineRegistry
    private readonly _events: EventSink<PlayerEvent>
    private _activeEngineEventSubscription: EventSubscription<PlaybackEngineEvent> | null
    private _activeEngine: PlaybackEngine | null
    private _queue: Queue<PlayableItem>
    private _playingEntry: QueueEntry<PlayableItem> | null

    constructor(engineRegistry: PlaybackEngineRegistry) {
        this._engineRegistry = engineRegistry
        ;[this._events, this.$events] = createEvent()
        this._activeEngineEventSubscription = null
        this._activeEngine = null
        this._queue = new Queue()
        this._playingEntry = null
    }

    private _changeEngine(newEngine: PlaybackEngine | null) {
        if (this._activeEngine === newEngine) {
            return
        }
        if (this._activeEngine !== null) {
            this._activeEngine.stop()
            this._activeEngineEventSubscription?.unsubscribe()
            this._activeEngineEventSubscription = null
        }
        this._activeEngine = newEngine
        if (newEngine !== null) {
            this._activeEngineEventSubscription = newEngine.$events.subscribe(
                (e) => this._handleEngineEvent(e),
            )
        }
    }

    private async _playEntry(
        entry: QueueEntry<PlayableItem>,
        options: Omit<PlaybackEngineEnqueueOptions, "itemToPlay">,
    ): Promise<void> {
        const engine = await this._engineRegistry.findPlaybackEngineFor(
            entry.item,
        )
        if (engine === null) {
            this._events.dispatch({
                type: "encounteredError",
                error: new Error(
                    `No engine available to play item ${entry.item}`,
                ),
            })
            return
        }
        this._changeEngine(engine)
        this._playingEntry = entry
        await engine.enqueue({
            itemToPlay: entry.item,
            ...options,
        })
    }

    private async _handleEngineEvent(
        event: PlaybackEngineEvent,
    ): Promise<void> {
        switch (event.type) {
            case "playbackStateDidChange":
            case "playingItemChanged":
            case "encounteredError":
                this._events.dispatch(event)
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
                    this._events.dispatch(event)
                    return
                }
                await this._playEntry(nextEntry, { playNow: true })
                break
            }
        }
    }

    get playingEntry(): QueueEntry<PlayableItem> | null {
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

    get queue(): Queue<PlayableItem> {
        return this._queue
    }

    /** Events relating to the state of playback */
    readonly $events: EventStream<PlayerEvent>

    async replaceQueue({
        newQueue,
        startingItem,
        ...options
    }: ReplaceQueueOptions): Promise<void> {
        await this._activeEngine?.stop()

        this._queue = newQueue
        this._events.dispatch({ type: "queueDidChange" })
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
}
