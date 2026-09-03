import type { PlayableItem } from "@magritte/sdk"
import { useSyncExternalStore } from "react"

import usePlayer from "@/hooks/playerHook"
import type { Queue } from "@/playback/queue/base"
import { filterTo } from "@/utilities/events"

export default function useQueue(): Queue<PlayableItem> {
    const player = usePlayer()
    const queue = useSyncExternalStore(
        (onStoreChange) => player.$events(filterTo("type", "queueDidChange", onStoreChange)),
        () => player.queue,
    )
    return queue
}
