import type { PlaybackState } from "@magritte/sdk"
import { useSyncExternalStore } from "react"

import usePlayer from "@/hooks/playerHook"
import { justEventsMatching } from "@/utilities/events"

export default function usePlaybackState(): PlaybackState {
    const player = usePlayer()
    const playbackState = useSyncExternalStore(
        (onStoreChange) =>
            player.subscribe(justEventsMatching("type", "playbackStateDidChange", onStoreChange)),
        () => player.playbackState,
    )
    return playbackState
}
