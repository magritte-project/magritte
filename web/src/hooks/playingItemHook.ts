import type { PlayableItem } from "@magritte/sdk"
import { useSyncExternalStore } from "react"

import usePlayer from "@/hooks/playerHook"
import { justEventsMatching } from "@/utilities/events"

export default function usePlayingItem(): PlayableItem | null {
    const player = usePlayer()
    const playingItem = useSyncExternalStore(
        (onStoreChange) =>
            player.subscribe(justEventsMatching("type", "playingItemChanged", onStoreChange)),
        () => player.playingItem,
    )
    return playingItem
}
