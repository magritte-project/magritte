import type { PlayableItem, PlaybackState, PlaybackTime } from "@magritte/sdk"

import type {
    PlaybackEngine,
    PlaybackEngineEnqueueOptions,
    PlaybackEngineEvent,
} from "@/playback/engine"
import type PlaybackEngineRegistry from "@/playback/engineRegistry"
import { PlaybackModes } from "@/playback/modes"
import ArrayQueue from "@/playback/queue/array"
import { type Queue, type RandomItemContext } from "@/playback/queue/base"
import { CountingStack, type ReadonlyCountingStack } from "@/utilities/countingStack"
import {
    type EventCallbackUnsubscriber,
    type EventSink,
    type EventStream,
    createEvent,
} from "@/utilities/events"
import { resolveNewValue } from "@/utilities/react"

export type PlayerEvent =
    | PlaybackEngineEvent
    | { type: "queueDidChange" }
    | { type: "playbackModesDidChange"; modes: PlaybackModes }
    | { type: "volumeDidChange"; volume: number }
    | {
          type: "playingItemSeeked"
          totalTime: number | null
          oldTime: number | null
          newTime: number
      }

export interface ReplaceQueueOptions extends Omit<PlaybackEngineEnqueueOptions, "itemToPlay"> {
    readonly newQueue: Queue<PlayableItem>
    readonly startingItem?: PlayableItem
}

export class Player {
    private readonly _engineRegistry: PlaybackEngineRegistry
    private readonly _dispatch: EventSink<PlayerEvent>
    private readonly _playedItems: CountingStack<PlayableItem, "id">
    private readonly _shuffleContext: ShuffleContext
    private _modes: PlaybackModes
    private _activeEngineEventUnsubscribe: EventCallbackUnsubscriber | null
    private _activeEngine: PlaybackEngine | null
    private _queue: Queue<PlayableItem>
    private _playingItem: PlayableItem | null
    private _playbackState: PlaybackState
    private _volume: number

    constructor(engineRegistry: PlaybackEngineRegistry) {
        this._engineRegistry = engineRegistry
        ;[this._dispatch, this.subscribe] = createEvent({ label: "Player", awaitsCallbacks: false })
        this._playedItems = new CountingStack("id")
        this._shuffleContext = new ShuffleContext(this._playedItems)
        this._modes = PlaybackModes.default
        this._activeEngineEventUnsubscribe = null
        this._activeEngine = null
        this._queue = ArrayQueue.of()
        this._playingItem = null
        this._playbackState = "stopped"
        this._volume = parseFloat(localStorage.getItem("player.volume") ?? "1.0")

        this._engineRegistry.subscribe(async (event) => {
            switch (event.type) {
                case "playbackEngineUnregistered":
                    if (this._activeEngine === event.engine) {
                        await this._engineLost()
                    }
                    break
                default:
                    break
            }
        })
    }

    private async _engineLost(): Promise<void> {
        this._activeEngineEventUnsubscribe?.()
        this._activeEngineEventUnsubscribe = null

        this._activeEngine = null

        this._playbackState = "stopped"
        await this._dispatch({ type: "playbackStateDidChange", playbackState: "stopped" })

        this._playingItem = null
        await this._dispatch({ type: "playingItemChanged" })
    }

    private async _changeEngine(newEngine: PlaybackEngine | null): Promise<void> {
        if (this._activeEngine === newEngine) {
            return
        }
        if (this._activeEngine !== null) {
            await this._activeEngine.stop()
            this._activeEngineEventUnsubscribe?.()
            this._activeEngineEventUnsubscribe = null
        }
        this._activeEngine = newEngine
        if (newEngine !== null) {
            await newEngine.syncPlaybackModes(this._modes)
            await newEngine.syncVolume(this._volume)
            this._activeEngineEventUnsubscribe = newEngine.subscribe((e) =>
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
            this._dispatch({
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

    private async _dequeuePreviousItem(): Promise<PlayableItem | null> {
        if (this._playingItem === null) {
            return await this.queue.firstItem()
        }
        if (this._modes.repeat === "one") {
            return this._playingItem
        } else {
            const previousItem =
                this._modes.shuffle === "on"
                    ? (this._playedItems.pop() ?? null)
                    : await this._queue.itemPreceding(this._playingItem)
            if (previousItem === null && this._modes.repeat === "all") {
                this._playedItems.clear() // TODO: ew??
                return await this.queue.lastItem()
            } else {
                return previousItem
            }
        }
    }

    private async _dequeueNextItem(): Promise<PlayableItem | null> {
        if (this._playingItem === null) {
            return this._modes.shuffle === "on"
                ? await this._queue.randomItem(this._shuffleContext)
                : await this.queue.firstItem()
        }

        if (this._modes.repeat === "one") {
            return this._playingItem
        } else {
            this._playedItems.push(this._playingItem)

            const nextItem =
                this._modes.shuffle === "on"
                    ? await this._queue.randomItem(this._shuffleContext)
                    : await this._queue.itemFollowing(this._playingItem)
            if (nextItem === null && this._modes.repeat === "all") {
                this._playedItems.clear() // TODO: ew??
                return await this.queue.firstItem()
            } else {
                return nextItem
            }
        }
    }

    private async _handleEngineEvent(event: PlaybackEngineEvent): Promise<void> {
        switch (event.type) {
            case "playbackStateDidChange":
                this._playbackState = event.playbackState
                this._dispatch(event)
                break
            case "playingItemChanged":
            case "encounteredError":
                this._dispatch(event)
                break
            case "endOfAudio": {
                const nextItem = await this._dequeueNextItem()
                if (nextItem === null) {
                    await this.stop()
                    this._dispatch(event)
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

    get playbackModes(): PlaybackModes {
        return this._modes
    }

    get playbackState(): PlaybackState {
        return this._playbackState
    }

    get queue(): Queue<PlayableItem> {
        return this._queue
    }

    get volume(): number {
        return this._volume
    }

    set volume(volume: number) {
        const normalizedVolume = Math.max(0, Math.min(1, volume))
        this._volume = normalizedVolume
        localStorage.setItem("player.volume", String(normalizedVolume))
        this._activeEngine?.syncVolume(normalizedVolume)
        this._dispatch({ type: "volumeDidChange", volume: normalizedVolume })
    }

    /** Events relating to the state of playback */
    readonly subscribe: EventStream<PlayerEvent>

    async setPlaybackModes(
        newModes: PlaybackModes | ((prevState: PlaybackModes) => PlaybackModes),
    ): Promise<void> {
        const modes = resolveNewValue(this._modes, newModes)
        this._modes = modes
        if (this._activeEngine !== null) {
            await this._activeEngine.syncPlaybackModes(modes)
        }
        await this._dispatch({ type: "playbackModesDidChange", modes })
    }

    async replaceQueue({ newQueue, startingItem, ...options }: ReplaceQueueOptions): Promise<void> {
        this._playedItems.clear()
        await this._activeEngine?.stop()

        // TODO: Observe queue events
        this._queue = newQueue
        this._dispatch({ type: "queueDidChange" })
        const item = startingItem ?? (await this._dequeueNextItem())
        if (item === null) {
            return // shrug
        }
        await this._playItem(item, options)
    }

    async skipPrevious(): Promise<boolean> {
        const { elapsedTime: currentTime } = await this.getCurrentTime()
        if (currentTime !== null && currentTime > 10) {
            await this.seek(0)
            return true
        }
        if (this._activeEngine !== null) {
            const skipped = await this._activeEngine.skipPreviousItemChapter()
            if (skipped) {
                return true
            }
        }
        const precedingItem = await this._dequeuePreviousItem()
        if (precedingItem === null) {
            await this.stop()
            return false
        }
        const playNow = this._playingItem === null || this.playbackState !== "paused"
        await this._playItem(precedingItem, { playNow })
        return true
    }

    async skipNext(): Promise<boolean> {
        if (this._activeEngine !== null) {
            const skipped = await this._activeEngine.skipNextItemChapter()
            if (skipped) {
                return true
            }
        }
        const followingItem = await this._dequeueNextItem()
        if (followingItem === null) {
            await this.stop()
            return false
        }
        const playNow = this._playingItem === null || this.playbackState !== "paused"
        await this._playItem(followingItem, { playNow })
        return true
    }

    async getCurrentTime(): Promise<PlaybackTime> {
        const currentTime = await this._activeEngine?.getCurrentTime()
        return {
            elapsedTime: currentTime?.elapsedTime ?? null,
            totalTime: currentTime?.totalTime ?? null,
        }
    }

    async seek(newTime: number): Promise<void> {
        const { totalTime, elapsedTime: oldTime } = await this.getCurrentTime()
        await this._activeEngine?.seek(newTime)
        await this._dispatch({ type: "playingItemSeeked", totalTime, oldTime, newTime })
    }

    async pause(): Promise<void> {
        await this._activeEngine?.pause()
    }

    async resume(): Promise<void> {
        await this._activeEngine?.resume()
    }

    async stop(): Promise<void> {
        this._playedItems.clear()
        await this._activeEngine?.stop()

        this._playbackState = "stopped"
        await this._dispatch({ type: "playbackStateDidChange", playbackState: "stopped" })

        this._playingItem = null
        await this._dispatch({ type: "playingItemChanged" })
    }
}

class ShuffleContext implements RandomItemContext<PlayableItem> {
    private readonly _playedItems: ReadonlyCountingStack<PlayableItem, "id">

    constructor(playedItems: ReadonlyCountingStack<PlayableItem, "id">) {
        this._playedItems = playedItems
    }

    getNumberOfPlayedItems = async (): Promise<number> => {
        return this._playedItems.size
    }

    hasPlayedItem = async (item: PlayableItem): Promise<boolean> => {
        return this._playedItems.has(item.id)
    }

    randomIndex = async (length: number): Promise<number> => {
        return Math.floor(Math.random() * length)
    }
}
