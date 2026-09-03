import type { PlaybackState } from "@magritte/sdk"
import { useSyncExternalStore } from "react"

import usePlayer from "@/hooks/playerHook"
import { filterTo } from "@/utilities/events"

export default function usePlaybackState(): PlaybackState {
    const player = usePlayer()
    const playbackState = useSyncExternalStore(
        (onStoreChange) =>
            player.$events(filterTo("type", "playbackStateDidChange", onStoreChange)),
        () => player.playbackState,
    )
    return playbackState
}
