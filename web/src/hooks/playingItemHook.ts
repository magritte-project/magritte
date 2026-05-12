import type { PlayableItem } from "@magritte/sdk/host"
import { useSyncExternalStore } from "react"

import usePlayer from "@/hooks/playerHook"

export default function usePlayingItem(): PlayableItem | null {
    const player = usePlayer()
    const playingItem = useSyncExternalStore(
        (onStoreChange) => {
            const subscription = player.$events.subscribe((event) => {
                switch (event.type) {
                    case "playingItemChanged":
                        onStoreChange()
                        break
                    default:
                        break
                }
            })
            return () => subscription.unsubscribe()
        },
        () => {
            return player.playingItem
        },
    )
    return playingItem
}
