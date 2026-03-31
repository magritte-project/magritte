import type { PlaybackEngine as ExtensionPlaybackEngine } from "@magritte/sdk/extension"
import type { PlayableItem, PlaybackState } from "@magritte/sdk/host"

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

    constructor(
        instance: ExtensionInstance,
        private readonly engine: ExtensionPlaybackEngine,
    ) {
        ;[this._events, this.$events] = createEvent()

        instance.extension.$events.subscribe((event) => {
            this.handleEvent(event)
        })
    }

    private async handleEvent(event: Event) {
        switch (event.type) {
            case "PlaybackEngine.playbackStateDidChange":
                this._events.dispatch({ type: "playbackStateDidChange" })
                break
            case "PlaybackEngine.playingItemChanged":
                this._events.dispatch({ type: "playingItemChanged" })
                break
            case "PlaybackEngine.encounteredError":
                break
            case "PlaybackEngine.endOfAudio":
                break
            default:
                break
        }
    }

    get playingItem(): PlayableItem | null {
        return null
    }

    get playbackState(): PlaybackState {
        return "stopped"
    }

    get totalTime(): number | null {
        return null
    }

    get currentTime(): number | null {
        return null
    }

    readonly $events: EventStream<PlaybackEngineEvent>

    async setPlaybackModes(modes: PlaybackModes): Promise<void> {
        await this.engine.setPlaybackModes(modes)
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
