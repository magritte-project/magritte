import type { PlayableItem, PlaybackState } from "@magritte/sdk/host"
import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useEffect, useState } from "react"

import useExtensionHost from "@/hooks/extensionHostHook"

export const Route = createFileRoute("/")({
    component: function IndexComponent() {
        const host = useExtensionHost()
        const [nowPlaying, setNowPlaying] = useState<{
            state: PlaybackState
            item: PlayableItem | null
        } | null>(null)

        const handleShowToast = useCallback(async () => {
            const chrome = await host.chrome()
            await chrome.showToast({
                message: "Hello from the extension",
                type: "info",
            })
        }, [host])

        useEffect(() => {
            const update = async () => {
                const player = await host.player()
                setNowPlaying(await player.getNowPlaying())
            }
            const subscription = host.$notifications.subscribe(async (notification) => {
                if (notification.name === "Magritte.NowPlayingDidChange") {
                    await update()
                }
            })
            update()
            return () => {
                subscription.unsubscribe()
            }
        }, [host])

        return (
            <div className="flex flex-col gap-2">
                <button type="button" onClick={handleShowToast}>
                    Show Toast
                </button>

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
