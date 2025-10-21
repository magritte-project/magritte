import type { SongRead } from "@/api/openapi"
import type {
    PlaybackEngineEvent,
    PlaybackEngineState,
} from "@/playback/engine"
import type { Player } from "@/playback/player"
import { useEffect, useState } from "react"
import usePlayer from "./playerHook"

export interface UsePlayerStateResult {
    readonly playbackState: PlaybackEngineState
    readonly totalTime: number | null
    readonly getCurrentTime: () => number | null
    readonly playingSong: SongRead | null
}

function createPlayerState(player: Player): UsePlayerStateResult {
    return {
        playbackState: player.playbackState,
        totalTime: player.totalTime,
        getCurrentTime: (): number | null => {
            return player.currentTime
        },
        playingSong: player.playingEntry?.item ?? null,
    }
}

export default function usePlayerState(): UsePlayerStateResult {
    const player = usePlayer()
    const [playerState, setPlayerState] = useState(() =>
        createPlayerState(player),
    )

    useEffect(() => {
        const eventListener = (event: PlaybackEngineEvent<SongRead>) => {
            switch (event.detail.type) {
                case "playbackStateDidChange":
                case "playingItemChanged":
                case "endOfAudio":
                    setPlayerState(createPlayerState(player))
                    break
                case "encounteredError":
                    break
            }
        }
        player.addEventListener(eventListener)
        return () => {
            player.removeEventListener(eventListener)
        }
    }, [player])

    return playerState
}
