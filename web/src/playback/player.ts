import type { PlayableItem, PlaybackState, PlaybackTime } from "@magritte/sdk/host"

import {
    type EventSink,
    type EventStream,
    type EventSubscription,
    createEvent,
} from "@magritte/sdk/utilities"

import type {
    PlaybackEngine,
    PlaybackEngineEnqueueOptions,
    PlaybackEngineEvent,
} from "@/playback/engine"
import type PlaybackEngineRegistry from "@/playback/engineRegistry"

import { PlaybackModes } from "@/playback/modes"
import { type Queue, type RandomItemContext } from "@/playback/queue/base"
import EmptyQueue from "@/playback/queue/empty"
import { CountingStack, type ReadonlyCountingStack } from "@/utilities/countingStack"
import { resolveNewValue } from "@/utilities/react"

export type PlayerEvent =
    | PlaybackEngineEvent
    | { type: "queueDidChange" }
    | { type: "playbackModesDidChange"; modes: PlaybackModes }
    | { type: "volumeDidChange"; volume: number }

export interface ReplaceQueueOptions extends Omit<PlaybackEngineEnqueueOptions, "itemToPlay"> {
    readonly newQueue: Queue<PlayableItem>
    readonly startingItem?: PlayableItem
}

export class Player {
    private readonly _engineRegistry: PlaybackEngineRegistry
    private readonly _events: EventSink<PlayerEvent>
    private readonly _playedItems: CountingStack<PlayableItem, "id">
    private readonly _shuffleContext: ShuffleContext
    private _modes: PlaybackModes
    private _activeEngineEventSubscription: EventSubscription<PlaybackEngineEvent> | null
    private _activeEngine: PlaybackEngine | null
    private _queue: Queue<PlayableItem>
    private _playingItem: PlayableItem | null
    private _playbackState: PlaybackState
    private _volume: number

    constructor(engineRegistry: PlaybackEngineRegistry) {
        this._engineRegistry = engineRegistry
        ;[this._events, this.$events] = createEvent()
        this._playedItems = new CountingStack("id")
        this._shuffleContext = new ShuffleContext(this._playedItems)
        this._modes = PlaybackModes.default
        this._activeEngineEventSubscription = null
        this._activeEngine = null
        this._queue = new EmptyQueue()
        this._playingItem = null
        this._playbackState = "stopped"
        this._volume = parseFloat(localStorage.getItem("player.volume") ?? "1.0")
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
            await newEngine.syncPlaybackModes(this._modes)
            await newEngine.syncVolume(this._volume)
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
                this._events.dispatch(event)
                break
            case "playingItemChanged":
            case "encounteredError":
                this._events.dispatch(event)
                break
            case "endOfAudio": {
                const nextItem = await this._dequeueNextItem()
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
        this._events.dispatch({ type: "volumeDidChange", volume: normalizedVolume })
    }

    /** Events relating to the state of playback */
    readonly $events: EventStream<PlayerEvent>

    async setPlaybackModes(
        newModes: PlaybackModes | ((prevState: PlaybackModes) => PlaybackModes),
    ): Promise<void> {
        const modes = resolveNewValue(this._modes, newModes)
        this._modes = modes
        if (this._activeEngine !== null) {
            await this._activeEngine.syncPlaybackModes(modes)
        }
        await this._events.dispatch({ type: "playbackModesDidChange", modes })
    }

    async replaceQueue({ newQueue, startingItem, ...options }: ReplaceQueueOptions): Promise<void> {
        await this.stop()

        // TODO: Observe queue events
        this._queue = newQueue
        this._events.dispatch({ type: "queueDidChange" })
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
        const precedingItem = await this._dequeuePreviousItem()
        if (precedingItem === null) {
            await this.stop()
            return false
        }
        await this._playItem(precedingItem, { playNow: true })
        return true
    }

    async skipNext(): Promise<boolean> {
        const followingItem = await this._dequeueNextItem()
        if (followingItem === null) {
            await this.stop()
            return false
        }
        await this._playItem(followingItem, { playNow: true })
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
        this._playbackState = "stopped"
        this._playedItems.clear()
        await this._activeEngine?.stop()
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
