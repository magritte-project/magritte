import type { SongRead } from "@/api/openapi"
import type { PlaybackEngine } from "@/playback/engine"
import WebPlaybackEngine from "@/playback/engines/web"

const allEngines: PlaybackEngine<SongRead>[] = [WebPlaybackEngine.shared]

export function installPlaybackEngine(newEngine: PlaybackEngine<SongRead>) {
    allEngines.push(newEngine)
}

export function uninstallPlaybackEngine(oldEngine: PlaybackEngine<SongRead>) {
    const toRemove = allEngines.indexOf(oldEngine)
    if (toRemove !== -1) {
        allEngines.splice(toRemove, 1)
    }
}

export async function findPlaybackEngineFor(
    item: SongRead,
): Promise<PlaybackEngine<SongRead> | null> {
    for (const engine of allEngines) {
        if (await engine.canEnqueue(item)) {
            return engine
        }
    }
    return null
}
