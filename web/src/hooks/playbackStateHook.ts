import type { PlaybackEngineState } from "@/playback/engine"
import { useSyncExternalStore } from "react"
import usePlayer from "@/hooks/playerHook"

export default function usePlaybackState(): PlaybackEngineState {
    const player = usePlayer()
    const playbackState = useSyncExternalStore(
        (onStoreChange) => {
            const subscription = player.$events.subscribe((event) => {
                switch (event.type) {
                    case "playbackStateDidChange":
                        onStoreChange()
                        break
                    default:
                        break
                }
            })
            return () => subscription.unsubscribe()
        },
        () => {
            return player.playbackState
        },
    )
    return playbackState
}
