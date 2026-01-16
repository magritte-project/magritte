import type { PlaybackEngine } from "@/playback/engine"
import type { PlayableItem } from "@/playback/item"
import type { ServiceRegistry } from "@/services/registry"

export default class PlaybackEngineRegistry {
    private _engines: PlaybackEngine[]

    constructor(serviceRegistry: ServiceRegistry) {
        // TODO: This should observe service registry
        const streamingMusicServices = serviceRegistry.services("streamingMusic")
        this._engines = streamingMusicServices.flatMap((service) =>
            service.constructPlaybackEngines(),
        )
    }

    installPlaybackEngine(newEngine: PlaybackEngine): this {
        this._engines.push(newEngine)
        return this
    }

    uninstallPlaybackEngine(oldEngine: PlaybackEngine): this {
        const toRemove = this._engines.indexOf(oldEngine)
        if (toRemove !== -1) {
            this._engines.splice(toRemove, 1)
        }
        return this
    }

    async findPlaybackEngineFor(item: PlayableItem): Promise<PlaybackEngine | null> {
        for (const engine of this._engines) {
            if (await engine.canEnqueue(item)) {
                return engine
            }
        }
        return null
    }
}
