import usePlayer from "@/hooks/playerHook"
import type { PlayableItem } from "@/playback/item"
import { useSyncExternalStore } from "react"

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
            return player.playingEntry?.item ?? null
        },
    )
    return playingItem
}
