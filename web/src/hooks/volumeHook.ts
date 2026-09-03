import { useCallback, useSyncExternalStore } from "react"

import usePlayer from "@/hooks/playerHook"
import { filterTo } from "@/utilities/events"
import { resolveNewValue } from "@/utilities/react"

export default function useVolume(): [number, React.Dispatch<React.SetStateAction<number>>] {
    const player = usePlayer()
    const volume = useSyncExternalStore(
        (onStoreChange) => player.$events(filterTo("type", "volumeDidChange", onStoreChange)),
        () => player.volume,
    )
    const setVolume = useCallback(
        (newVolume: React.SetStateAction<number>) => {
            player.volume = resolveNewValue(player.volume, newVolume)
        },
        [player],
    )
    return [volume, setVolume]
}
