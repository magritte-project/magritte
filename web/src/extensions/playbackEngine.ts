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
import { createEvent, type EventDispatch, type EventSubscribe } from "@/utilities/events"

export class ExtensionPlaybackEngineProxy implements PlaybackEngine {
    private readonly _dispatch: EventDispatch<PlaybackEngineEvent>
    private _playingItem: PlayableItem | null

    constructor(
        broadcaster: RPCBroadcaster,
        private readonly engine: ExtensionPlaybackEngine,
        private readonly sourceSchemes: readonly string[],
    ) {
        ;[this._dispatch, this.subscribe] = createEvent({ label: "ExtensionPlaybackEngineProxy" })
        this._playingItem = null

        broadcaster.subscribe(PlaybackEnginePlaybackStateDidChange, async () => {
            const { playbackState, playingItem: item } = await this.engine.getNowPlaying()
            this._playingItem = item
            await this._dispatch({ type: "playbackStateDidChange", playbackState })
        })
        broadcaster.subscribe(PlaybackEnginePlayingItemChanged, async () => {
            const { playingItem } = await this.engine.getNowPlaying()
            this._playingItem = playingItem
            await this._dispatch({ type: "playingItemChanged" })
        })
        broadcaster.subscribe(PlaybackEngineEncounteredError, async (data) => {
            await this._dispatch({
                type: "encounteredError",
                error: new Error(data?.message ?? ""),
            })
        })
        broadcaster.subscribe(PlaybackEngineEndOfAudio, async () => {
            await this._dispatch({ type: "endOfAudio", lastItem: this._playingItem })
            this._playingItem = null
        })
    }

    readonly subscribe: EventSubscribe<PlaybackEngineEvent>

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

    async skipPreviousItemChapter(): Promise<boolean> {
        return await this.engine.skipPreviousItemSubdivision()
    }

    async skipNextItemChapter(): Promise<boolean> {
        return await this.engine.skipNextItemSubdivision()
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
