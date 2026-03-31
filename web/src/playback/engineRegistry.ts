import type { PlayableItem } from "@magritte/sdk/host"

import type { PlaybackEngine } from "@/playback/engine"

import { isServiceOfType, type Service } from "@/services/base"
import { ServiceRegistry } from "@/services/registry"

export interface PlaybackEngineRegistryOptions {
    readonly serviceRegistry: ServiceRegistry
    readonly defaultEngine: PlaybackEngine
}

export default class PlaybackEngineRegistry {
    private _engines: Map<string, PlaybackEngine>
    private _defaultEngine: PlaybackEngine

    constructor({ serviceRegistry, defaultEngine }: PlaybackEngineRegistryOptions) {
        this._engines = new Map(serviceRegistry.playbackEngines)
        this._defaultEngine = defaultEngine

        serviceRegistry.$events.subscribe((event) => {
            switch (event.type) {
                case "serviceAdded":
                    this._onServiceAdded(event.service)
                    break
                case "serviceRemoved":
                    this._onServiceRemoved(event.service)
                    break
                default:
                    break
            }
        })
    }

    private _onServiceAdded(service: Service) {
        if (isServiceOfType(service, "playback")) {
            this._engines.set(service.name, service.playbackEngine)
        }
    }

    private _onServiceRemoved(service: Service) {
        this._engines.delete(service.name)
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
