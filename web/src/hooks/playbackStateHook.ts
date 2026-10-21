import type { PlaybackState } from "@magritte/sdk"
import { useCallback, useSyncExternalStore } from "react"

import usePlayer from "@/hooks/playerHook"
import { justEventsMatching } from "@/utilities/events"

export interface UsePlaybackStateResult {
    readonly playbackState: PlaybackState
    readonly pauseResume: () => Promise<void>
    readonly skipPrevious: () => Promise<boolean>
    readonly skipNext: () => Promise<boolean>
}

export default function usePlaybackState(): UsePlaybackStateResult {
    const player = usePlayer()
    const playbackState = useSyncExternalStore(
        (onStoreChange) =>
            player.subscribe(justEventsMatching("type", "playbackStateDidChange", onStoreChange)),
        () => player.playbackState,
    )

    const pauseResume = useCallback(
        () => (player.playbackState === "playing" ? player.pause() : player.resume()),
        [player],
    )
    const skipPrevious = useCallback(() => player.skipPrevious(), [player])
    const skipNext = useCallback(() => player.skipNext(), [player])
    return { playbackState, pauseResume, skipPrevious, skipNext }
}
