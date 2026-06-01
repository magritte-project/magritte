import type { RPCBroadcaster } from "@magritte/rpc"
import {
    PlaybackEngineEncounteredError,
    PlaybackEngineEndOfAudio,
    PlaybackEnginePlaybackStateDidChange,
    PlaybackEnginePlayingItemChanged,
    type PlaybackEngine as ExtensionPlaybackEngine,
    type PlayableItem,
    type PlaybackTime,
} from "@magritte/sdk"

import type {
    PlaybackEngine,
    PlaybackEngineEnqueueOptions,
    PlaybackEngineEvent,
} from "@/playback/engine"
import type { PlaybackModes } from "@/playback/modes"
import { createEvent, type EventSink, type EventStream } from "@/utilities/events"

// TODO: Finish this

export class ExtensionPlaybackEngineProxy implements PlaybackEngine {
    private readonly _events: EventSink<PlaybackEngineEvent>
    private _playingItem: PlayableItem | null

    constructor(
        broadcaster: RPCBroadcaster,
        private readonly engine: ExtensionPlaybackEngine,
        private readonly sourceSchemes: readonly string[],
    ) {
        ;[this._events, this.$events] = createEvent()
        this._playingItem = null

        broadcaster.subscribe(PlaybackEnginePlaybackStateDidChange, async () => {
            const { playbackState, playingItem: item } = await this.engine.getNowPlaying()
            this._playingItem = item
            this._events.dispatch({ type: "playbackStateDidChange", playbackState })
        })
        broadcaster.subscribe(PlaybackEnginePlayingItemChanged, async () => {
            const { playingItem } = await this.engine.getNowPlaying()
            this._playingItem = playingItem
            this._events.dispatch({ type: "playingItemChanged" })
        })
        broadcaster.subscribe(PlaybackEngineEncounteredError, async (data) => {
            this._events.dispatch({
                type: "encounteredError",
                error: new Error(data?.message ?? ""),
            })
        })
        broadcaster.subscribe(PlaybackEngineEndOfAudio, async () => {
            this._events.dispatch({ type: "endOfAudio", lastItem: this._playingItem })
            this._playingItem = null
        })
    }

    readonly $events: EventStream<PlaybackEngineEvent>

    async syncPlaybackModes(modes: PlaybackModes): Promise<void> {
        await this.engine.syncPlaybackModes(modes)
    }

    async syncVolume(volume: number): Promise<void> {
        await this.engine.syncVolume(volume)
    }

    async canEnqueue(item: PlayableItem): Promise<boolean> {
        const sources = item.sources?.filter((source) =>
            this.sourceSchemes.some((scheme) => source.url.startsWith(`${scheme}:`)),
        )
        if (!sources || sources.length === 0) {
            return false
        }
        return await this.engine.canEnqueue({ item: { ...item, sources } })
    }

    async enqueue(options: PlaybackEngineEnqueueOptions): Promise<void> {
        await this.engine.enqueue(options)
    }

    async skipPreviousInQueue(): Promise<boolean> {
        return await this.engine.skipPreviousInQueue()
    }

    async skipNextInQueue(): Promise<boolean> {
        return await this.engine.skipNextInQueue()
    }

    async getCurrentTime(): Promise<PlaybackTime> {
        return await this.engine.getCurrentTime()
    }

    async seek(newTime: number): Promise<void> {
        await this.engine.seek({ newTime })
    }

    async pause(): Promise<void> {
        await this.engine.pause()
    }

    async resume(): Promise<void> {
        await this.engine.resume()
    }

    async stop(): Promise<void> {
        await this.engine.stop()
    }
}
