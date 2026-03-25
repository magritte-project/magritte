import type { PlayableItem } from "@magritte/sdk/host"

import { useSyncExternalStore } from "react"

import type { Queue } from "@/playback/queue/base"

import usePlayer from "@/hooks/playerHook"

export default function useQueue(): Queue<PlayableItem> {
    const player = usePlayer()
    const queue = useSyncExternalStore(
        (onStoreChange) => {
            const subscription = player.$events.subscribe((event) => {
                switch (event.type) {
                    case "queueDidChange":
                        onStoreChange()
                        break
                    default:
                        break
                }
            })
            return () => subscription.unsubscribe()
        },
        () => {
            return player.queue
        },
    )
    return queue
}
