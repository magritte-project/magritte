import type { PlaybackEngine } from "@/playback/engine"
import type { PlayableItem } from "@/playback/item"

export default class PlaybackEngineRegistry {
    private _engines: PlaybackEngine[]

    constructor() {
        this._engines = []
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

    async findPlaybackEngineFor(
        item: PlayableItem,
    ): Promise<PlaybackEngine | null> {
        for (const engine of this._engines) {
            if (await engine.canEnqueue(item)) {
                return engine
            }
        }
        return null
    }
}
