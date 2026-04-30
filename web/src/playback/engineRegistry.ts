import type { PlayableItem } from "@magritte/sdk/host"
import type { EventSubscription } from "@magritte/sdk/utilities"

import type { ExtensionInstanceEvent } from "@/extensions/instance"
import type { ExtensionManager, ExtensionManagerEvent } from "@/extensions/manager"
import type { PlaybackEngine } from "@/playback/engine"

import { ExtensionPlaybackEngineProxy } from "@/extensions/playbackEngine"

export interface PlaybackEngineRegistryOptions {
    readonly extensionManager: ExtensionManager
    readonly defaultEngine: PlaybackEngine
}

export default class PlaybackEngineRegistry {
    private readonly _engines: Map<string, PlaybackEngine>
    private readonly _defaultEngine: PlaybackEngine
    private readonly _extensionSubscriptions: Map<string, EventSubscription<ExtensionInstanceEvent>>

    constructor({ extensionManager, defaultEngine }: PlaybackEngineRegistryOptions) {
        this._engines = new Map()
        this._defaultEngine = defaultEngine
        this._extensionSubscriptions = new Map()

        extensionManager.$events.subscribe((event) => {
            this.handleExtensionEvent(event)
        })
    }

    private handleExtensionEvent(event: ExtensionManagerEvent) {
        switch (event.type) {
            case "extensionInstanceAcquired": {
                const subscription = event.instance.$events.subscribe((event) => {
                    this.handleExtensionInstanceEvent(event)
                })
                this._extensionSubscriptions.set(event.instance.manifest.id, subscription)
                break
            }
            case "extensionInstanceReleased": {
                const subscription = this._extensionSubscriptions.get(event.instance.manifest.id)
                if (subscription !== undefined) {
                    subscription.unsubscribe()
                    this._extensionSubscriptions.delete(event.instance.manifest.id)
                }
                break
            }
            default:
                break
        }
    }

    private async handleExtensionInstanceEvent(event: ExtensionInstanceEvent) {
        switch (event.type) {
            case "extensionInstanceLoaded": {
                try {
                    const playbackEngine = new ExtensionPlaybackEngineProxy(
                        event.instance,
                        await event.instance.extension.playbackEngine(),
                    )
                    this._engines.set(event.instance.manifest.id, playbackEngine)
                } catch (error) {
                    console.debug(
                        "Failed to get playback engine for extension",
                        event.instance.manifest.id,
                        error,
                    )
                }
                break
            }
            case "extensionInstanceUnloaded": {
                this._engines.delete(event.instance.manifest.id)
                break
            }
            default:
                break
        }
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
