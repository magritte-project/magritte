import { useSyncExternalStore } from "react"

import usePlayer from "@/hooks/playerHook"
import type { PlaybackModes } from "@/playback/modes"
import { filterTo } from "@/utilities/events"

export default function usePlaybackModes(): PlaybackModes {
    const player = usePlayer()
    const playbackModes = useSyncExternalStore(
        (onStoreChange) =>
            player.$events(filterTo("type", "playbackModesDidChange", onStoreChange)),
        () => player.playbackModes,
    )
    return playbackModes
}
