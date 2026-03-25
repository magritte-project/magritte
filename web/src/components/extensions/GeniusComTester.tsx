import { Extension, waitForExtensionConnection } from "@magritte/sdk/connection"
import { useEffect, useRef } from "react"

import usePlayer from "@/hooks/playerHook"
import useToast from "@/hooks/toastHook"

export default function GeniusComTester() {
    const { showToast } = useToast()
    const player = usePlayer()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const extensionRef = useRef<Extension | null>(null)

    useEffect(() => {
        const subscription = player.$events.subscribe(async (event) => {
            switch (event.type) {
                case "playbackStateDidChange":
                case "playingItemChanged":
                    const notifications = await extensionRef.current?.notifications()
                    notifications?.post({ name: "Magritte.NowPlayingDidChange" })
                    break
                default:
                    break
            }
        })
        return () => {
            subscription.unsubscribe()
        }
    }, [player])

    useEffect(() => {
        if (!containerRef.current) {
            return
        }
        const container = containerRef.current
        const iframe = document.createElement("iframe")
        iframe.width = "100%"
        iframe.height = "100%"
        iframe.src = "http://localhost:9292"
        ;(async () => {
            const extension = await waitForExtensionConnection({
                iframe,
                origin: "http://localhost:9292",
                chrome: {
                    showToast: async (options: {
                        message: string
                        type: "error" | "success" | "info"
                    }) => {
                        showToast(options)
                    },
                },
                nowPlaying: {
                    async getCurrentTime() {
                        return {
                            currentTime: player.currentTime,
                            totalTime: player.totalTime,
                        }
                    },

                    async seek({ newTime }) {
                        await player.seek(newTime)
                    },

                    async getNowPlaying() {
                        return {
                            state: player.playbackState,
                            item: player.playingItem,
                        }
                    },

                    async pause() {
                        await player.pause()
                    },

                    async resume() {
                        await player.resume()
                    },

                    async skipPrevious() {
                        await player.skipPrevious()
                    },

                    async skipNext() {
                        await player.skipNext()
                    },
                },
            })
            extensionRef.current = extension
        })()
        container.appendChild(iframe)
        return () => {
            container.removeChild(iframe)
        }
    }, [showToast, player])

    return <div ref={containerRef} />
}
