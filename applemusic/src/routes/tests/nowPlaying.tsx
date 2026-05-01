import type { RPCIncomingBroadcastEvent } from "@magritte/rpc"
import { type PlaybackState, type PlayableItem, PlayerProtocol } from "@magritte/sdk/host"
import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect } from "react"

import useExtensionHost from "@/hooks/extensionHostHook"

export const Route = createFileRoute("/tests/nowPlaying")({
    component: function NowPlayingComponent() {
        const host = useExtensionHost()
        const [nowPlaying, setNowPlaying] = useState<{
            state: PlaybackState
            item: PlayableItem | null
        } | null>(null)

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

        return (
            <div className="flex flex-col gap-2">
                <h1 className="font-bold text-xl">Now Playing</h1>
                <div className="flex flex-col gap-1">
                    <p className="font-semibl text-lg">{nowPlaying?.item?.title ?? "--"}</p>
                    <p className="text-gray-500">
                        {nowPlaying?.item?.album_title ?? "--"} by{" "}
                        {nowPlaying?.item?.artist_name ?? "--"}
                    </p>
                </div>
            </div>
        )
    },
})
