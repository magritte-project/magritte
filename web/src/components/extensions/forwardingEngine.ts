import type { PlaybackEngine as ExtensionPlaybackEngine } from "@magritte/sdk/extension"
import type { PlayableItem, PlaybackTime } from "@magritte/sdk/host"

import { type Event } from "@magritte/sdk/common"
import { createEvent, EventSink, type EventStream } from "@magritte/sdk/utilities"

import type { ExtensionInstance } from "@/extensions/extensionManager"
import type {
    PlaybackEngine,
    PlaybackEngineEnqueueOptions,
    PlaybackEngineEvent,
} from "@/playback/engine"
import type { PlaybackModes } from "@/playback/modes"

// TODO: Finish this

export class ForwardingPlaybackEngine implements PlaybackEngine {
    private readonly _events: EventSink<PlaybackEngineEvent>
    private _playingItem: PlayableItem | null

    constructor(
        instance: ExtensionInstance,
        private readonly engine: ExtensionPlaybackEngine,
    ) {
        ;[this._events, this.$events] = createEvent()
        this._playingItem = null

        instance.extension.$events.subscribe((event) => {
            this.handleEvent(event)
        })
    }

    private async handleEvent(event: Event) {
        switch (event.type) {
            case "PlaybackEngine.playbackStateDidChange":
                const { playbackState, playingItem: item } = await this.engine.getNowPlaying()
                this._playingItem = item
                this._events.dispatch({ type: "playbackStateDidChange", playbackState })
                break
            case "PlaybackEngine.playingItemChanged":
                const { playingItem } = await this.engine.getNowPlaying()
                this._playingItem = playingItem
                this._events.dispatch({ type: "playingItemChanged" })
                break
            case "PlaybackEngine.encounteredError":
                break
            case "PlaybackEngine.endOfAudio":
                this._events.dispatch({ type: "endOfAudio", lastItem: this._playingItem })
                this._playingItem = null
                break
            default:
                break
        }
    }

    readonly $events: EventStream<PlaybackEngineEvent>

    async syncPlaybackModes(modes: PlaybackModes): Promise<void> {
        await this.engine.syncPlaybackModes(modes)
    }

    async canEnqueue(item: PlayableItem): Promise<boolean> {
        return await this.engine.canEnqueue({ item })
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
