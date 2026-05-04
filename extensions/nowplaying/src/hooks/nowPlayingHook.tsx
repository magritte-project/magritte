import type { RPCIncomingBroadcastEvent } from "@magritte/rpc"

import { NowPlaying, PlayerProtocol } from "@magritte/sdk/host"
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
        const onIncomingBroadcast = (event: RPCIncomingBroadcastEvent) => {
            if (event.topic === PlayerProtocol.name && event.what === "nowPlayingDidChange") {
                update()
            }
        }
        host.connection.broadcaster.addEventListener("incomingBroadcast", onIncomingBroadcast)
        update()
        return () => {
            host.connection.broadcaster.removeEventListener(
                "incomingBroadcast",
                onIncomingBroadcast,
            )
        }
    }, [host])

    return nowPlaying
}
