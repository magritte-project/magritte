import { useCallback, useSyncExternalStore } from "react"

import usePlayer from "@/hooks/playerHook"
import { justEventsMatching } from "@/utilities/events"
import { resolveNewValue } from "@/utilities/react"

export default function useVolume(): [number, React.Dispatch<React.SetStateAction<number>>] {
    const player = usePlayer()
    const volume = useSyncExternalStore(
        (onStoreChange) =>
            player.subscribe(justEventsMatching("type", "volumeDidChange", onStoreChange)),
        () => player.volume,
    )
    const setVolume = useCallback(
        (newVolume: React.SetStateAction<number>) => {
            void player.setVolume(resolveNewValue(player.volume, newVolume))
        },
        [player],
    )
    return [volume, setVolume]
}
