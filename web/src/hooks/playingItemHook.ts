import type { PlayableItem } from "@magritte/sdk"
import { useSyncExternalStore } from "react"

import usePlayer from "@/hooks/playerHook"
import { filterTo } from "@/utilities/events"

export default function usePlayingItem(): PlayableItem | null {
    const player = usePlayer()
    const playingItem = useSyncExternalStore(
        (onStoreChange) => player.$events(filterTo("type", "playingItemChanged", onStoreChange)),
        () => player.playingItem,
    )
    return playingItem
}
