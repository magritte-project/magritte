import {
    createEvent,
    type EventSink,
    type EventStream,
    type Extension,
    type PlayableItem,
} from "@magritte/sdk"

import { ExtensionPlaybackEngineProxy } from "@/extensions/playbackEngine"
import type { ExtensionRuntime, ExtensionRuntimeEvent } from "@/extensions/runtime"
import type { PlaybackEngine } from "@/playback/engine"

export type PlaybackEngineRegistryEvent =
    | { type: "playbackEngineRegistered"; engine: PlaybackEngine }
    | { type: "playbackEngineUnregistered"; engine: PlaybackEngine }

export interface PlaybackEngineRegistryOptions {
    readonly defaultEngine: PlaybackEngine
}

export default class PlaybackEngineRegistry {
    private readonly _engines: Map<string, PlaybackEngine>
    private readonly _defaultEngine: PlaybackEngine
    private readonly _events: EventSink<PlaybackEngineRegistryEvent>

    constructor({ defaultEngine }: PlaybackEngineRegistryOptions) {
        this._engines = new Map()
        this._defaultEngine = defaultEngine
        ;[this._events, this.$events] = createEvent<PlaybackEngineRegistryEvent>()
    }

    readonly $events: EventStream<PlaybackEngineRegistryEvent>

    private async _registerExtension(extension: Extension) {
        try {
            const engine = new ExtensionPlaybackEngineProxy(
                extension.connection.broadcaster,
                await extension.playbackEngine(),
            )
            this._engines.set(extension.manifest.id, engine)

            console.debug("Registered playback engine for extension", extension.manifest.id)
            this._events.dispatch({ type: "playbackEngineRegistered", engine })
        } catch (error) {
            console.debug(
                "Failed to get playback engine for extension",
                extension.manifest.id,
                error,
            )
        }
    }

    private _unregisterExtension(id: string) {
        const engine = this._engines.get(id)
        if (engine !== undefined) {
            this._engines.delete(id)

            console.debug("Unregistered playback engine for extension", id)
            this._events.dispatch({ type: "playbackEngineUnregistered", engine })
        }
    }

    private async handleExtensionEvent(event: ExtensionRuntimeEvent) {
        switch (event.type) {
            case "extensionLoaded": {
                await this._registerExtension(event.extension)
                break
            }
            case "extensionUnloaded": {
                this._unregisterExtension(event.extension.manifest.id)
                break
            }
            default: {
                break
            }
        }
    }

    async subscribeTo(extensionRuntime: ExtensionRuntime) {
        for (const extension of extensionRuntime.running) {
            this._registerExtension(extension)
        }
        return extensionRuntime.$events.subscribe((event) => {
            this.handleExtensionEvent(event)
        })
    }

    get engines(): readonly PlaybackEngine[] {
        return [...this._engines.values(), this._defaultEngine]
    }

    async findPlaybackEngineFor(item: PlayableItem): Promise<PlaybackEngine | null> {
        for (const engine of this.engines) {
            if (await engine.canEnqueue(item)) {
                return engine
            }
        }
        return null
    }
}
