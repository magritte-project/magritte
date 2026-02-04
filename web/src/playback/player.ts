import type {
    PlaybackEngine,
    PlaybackEngineEnqueueOptions,
    PlaybackEngineEvent,
    PlaybackEngineState,
} from "@/playback/engine"
import type PlaybackEngineRegistry from "@/playback/engineRegistry"
import type { PlayableItem } from "@/playback/item"

import { PlaybackModes } from "@/playback/modes"
import { type Queue, type QueueItemContext } from "@/playback/queue/base"
import EmptyQueue from "@/playback/queue/empty"
import {
    type EventSink,
    type EventStream,
    type EventSubscription,
    createEvent,
} from "@/utilities/events"

export type PlayerEvent =
    | PlaybackEngineEvent
    | { type: "queueDidChange" }
    | { type: "playbackModesDidChange"; modes: PlaybackModes }

export interface ReplaceQueueOptions extends Omit<PlaybackEngineEnqueueOptions, "itemToPlay"> {
    readonly newQueue: Queue<PlayableItem>
    readonly startingItem?: PlayableItem
}

export class Player {
    private readonly _engineRegistry: PlaybackEngineRegistry
    private readonly _events: EventSink<PlayerEvent>
    private _modes: PlaybackModes
    private _activeEngineEventSubscription: EventSubscription<PlaybackEngineEvent> | null
    private _activeEngine: PlaybackEngine | null
    private _queue: Queue<PlayableItem>
    private _playingItem: PlayableItem | null

    constructor(engineRegistry: PlaybackEngineRegistry) {
        this._engineRegistry = engineRegistry
        ;[this._events, this.$events] = createEvent()
        this._modes = PlaybackModes.default
        this._activeEngineEventSubscription = null
        this._activeEngine = null
        this._queue = new EmptyQueue()
        this._playingItem = null
    }

    private get _queueItemContext(): QueueItemContext<PlayableItem> {
        return {
            getPlaybackModes: async () => this._modes,
            hasPlayedItem: async (_itemId: PlayableItem) => {
                // TODO: Implement this
                return false
            },
        }
    }

    private async _changeEngine(newEngine: PlaybackEngine | null): Promise<void> {
        if (this._activeEngine === newEngine) {
            return
        }
        if (this._activeEngine !== null) {
            await this._activeEngine.stop()
            this._activeEngineEventSubscription?.unsubscribe()
            this._activeEngineEventSubscription = null
        }
        this._activeEngine = newEngine
        if (newEngine !== null) {
            await newEngine.setPlaybackModes(this._modes)
            this._activeEngineEventSubscription = newEngine.$events.subscribe((e) =>
                this._handleEngineEvent(e),
            )
        }
    }

    private async _playItem(
        item: PlayableItem,
        options: Omit<PlaybackEngineEnqueueOptions, "itemToPlay">,
    ): Promise<void> {
        const engine = await this._engineRegistry.findPlaybackEngineFor(item)
        if (engine === null) {
            this._events.dispatch({
                type: "encounteredError",
                error: new Error(`No engine available to play item ${item}`),
            })
            return
        }
        this._changeEngine(engine)
        this._playingItem = item
        await engine.enqueue({
            itemToPlay: item,
            ...options,
        })
    }

    private async _handleEngineEvent(event: PlaybackEngineEvent): Promise<void> {
        switch (event.type) {
            case "playbackStateDidChange":
            case "playingItemChanged":
            case "encounteredError":
                this._events.dispatch(event)
                break
            case "endOfAudio": {
                if (this._playingItem === null) {
                    return
                }
                const nextItem = await this._queue.itemFollowing(
                    this._playingItem,
                    this._queueItemContext,
                )
                if (nextItem === null) {
                    await this.stop()
                    this._events.dispatch(event)
                    return
                }
                await this._playItem(nextItem, { playNow: true })
                break
            }
        }
    }

    get playingItem(): PlayableItem | null {
        return this._playingItem
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

    async setPlaybackModes(modes: PlaybackModes): Promise<void> {
        this._modes = modes
        if (this._activeEngine !== null) {
            await this._activeEngine.setPlaybackModes(modes)
        }
        await this._events.dispatch({ type: "playbackModesDidChange", modes })
    }

    async replaceQueue({ newQueue, startingItem, ...options }: ReplaceQueueOptions): Promise<void> {
        await this._activeEngine?.stop()

        // TODO: Observe queue events
        this._queue = newQueue
        this._events.dispatch({ type: "queueDidChange" })
        const item = startingItem ?? (await newQueue.firstItem(this._queueItemContext))
        if (item === null) {
            return // shrug
        }
        await this._playItem(item, options)
    }

    async skipPrevious(): Promise<boolean> {
        const currentTime = this.currentTime
        if (currentTime !== null && currentTime > 10) {
            await this.seek(0)
            return true
        }
        if (this._playingItem === null) {
            const firstItem = await this._queue.firstItem(this._queueItemContext)
            if (firstItem !== null) {
                await this._playItem(firstItem, { playNow: true })
                return true
            }
            return false
        } else {
            const previousItem = await this._queue.itemPreceding(
                this._playingItem,
                this._queueItemContext,
            )
            if (previousItem === null) {
                await this.stop()
                return false
            }
            await this._playItem(previousItem, { playNow: true })
            return true
        }
    }

    async skipNext(): Promise<boolean> {
        if (this._playingItem === null) {
            const firstItem = await this._queue.firstItem(this._queueItemContext)
            if (firstItem !== null) {
                await this._playItem(firstItem, { playNow: true })
                return true
            }
            return false
        } else {
            const followingItem = await this._queue.itemFollowing(
                this._playingItem,
                this._queueItemContext,
            )
            if (followingItem === null) {
                await this.stop()
                return false
            }
            await this._playItem(followingItem, { playNow: true })
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
        this._playingItem = null
        await this._activeEngine?.stop()
    }
}
