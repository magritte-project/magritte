import { useSyncExternalStore } from "react"

import type { PlaybackModes } from "@/playback/modes"

import usePlayer from "@/hooks/playerHook"

export default function usePlaybackModes(): PlaybackModes {
    const player = usePlayer()
    const playbackModes = useSyncExternalStore(
        (onStoreChange) => {
            const subscription = player.$events.subscribe((event) => {
                switch (event.type) {
                    case "playbackModesDidChange":
                        onStoreChange()
                        break
                    default:
                        break
                }
            })
            return () => subscription.unsubscribe()
        },
        () => {
            return player.playbackModes
        },
    )
    return playbackModes
}
