import { NowPlaying, PlayerNowPlayingDidChange } from "@magritte/sdk"
import { useEffect, useState } from "react"

import useExtensionHost from "@/hooks/extensionHostHook"

export default function useNowPlaying(): NowPlaying {
    const host = useExtensionHost()
    const [nowPlaying, setNowPlaying] = useState<NowPlaying>({ state: "stopped", item: null })

    useEffect(() => {
        const update = async () => {
            const player = await host.player()
            setNowPlaying(await player.getNowPlaying())
        }
        const subscription = host.connection.broadcaster.subscribe(
            PlayerNowPlayingDidChange,
            () => {
                update()
            },
        )
        update()
        return () => {
            subscription.unsubscribe()
        }
    }, [host])

    return nowPlaying
}
