import type {
    PlaybackEngineEvent,
    PlaybackEngineState,
} from "@/playback/engine"
import type { PlayableItem } from "@/playback/item"
import type { Player } from "@/playback/player"
import type { Queue } from "@/playback/queue"
import { useEffect, useState } from "react"
import usePlayer from "./playerHook"

export interface UsePlayerStateResult {
    readonly playbackState: PlaybackEngineState
    readonly totalTime: number | null
    readonly getCurrentTime: () => number | null
    readonly playingSong: PlayableItem | null
    readonly queue: Queue<PlayableItem>
}

function createPlayerState(player: Player): UsePlayerStateResult {
    return {
        playbackState: player.playbackState,
        totalTime: player.totalTime,
        getCurrentTime: (): number | null => {
            return player.currentTime
        },
        playingSong: player.playingEntry?.item ?? null,
        queue: player.queue,
    }
}

export default function usePlayerState(): UsePlayerStateResult {
    const player = usePlayer()
    const [playerState, setPlayerState] = useState(() =>
        createPlayerState(player),
    )

    useEffect(() => {
        const eventListener = (event: PlaybackEngineEvent) => {
            switch (event.type) {
                case "playbackStateDidChange":
                case "playingItemChanged":
                case "endOfAudio":
                    setPlayerState(createPlayerState(player))
                    break
                case "encounteredError":
                    break
            }
        }
        const subscription = player.$events.subscribe(eventListener)
        return () => {
            subscription.unsubscribe()
        }
    }, [player])

    return playerState
}
