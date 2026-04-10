import { useCallback, useSyncExternalStore } from "react"

import usePlayer from "@/hooks/playerHook"
import { resolveNewValue } from "@/utilities/react"

export default function useVolume(): [number, React.Dispatch<React.SetStateAction<number>>] {
    const player = usePlayer()
    const volume = useSyncExternalStore(
        (onStoreChange) => {
            const subscription = player.$events.subscribe((event) => {
                switch (event.type) {
                    case "volumeDidChange":
                        onStoreChange()
                        break
                    default:
                        break
                }
            })
            return () => subscription.unsubscribe()
        },
        () => {
            return player.volume
        },
    )
    const setVolume = useCallback(
        (newVolume: React.SetStateAction<number>) => {
            player.volume = resolveNewValue(player.volume, newVolume)
        },
        [player],
    )
    return [volume, setVolume]
}
