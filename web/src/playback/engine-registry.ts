import type { PlaybackEngine } from "@/playback/engine"

export default class PlaybackEngineRegistry<Item> {
    private _engines: PlaybackEngine<Item>[]

    constructor() {
        this._engines = []
    }

    installPlaybackEngine(newEngine: PlaybackEngine<Item>): this {
        this._engines.push(newEngine)
        return this
    }

    uninstallPlaybackEngine(oldEngine: PlaybackEngine<Item>): this {
        const toRemove = this._engines.indexOf(oldEngine)
        if (toRemove !== -1) {
            this._engines.splice(toRemove, 1)
        }
        return this
    }

    async findPlaybackEngineFor(
        item: Item,
    ): Promise<PlaybackEngine<Item> | null> {
        for (const engine of this._engines) {
            if (await engine.canEnqueue(item)) {
                return engine
            }
        }
        return null
    }
}
