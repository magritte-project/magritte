import { useEffect, useLayoutEffect, useRef } from "react"

import { InstalledExtension } from "@/extensions/extensionManager"
import usePlayer from "@/hooks/playerHook"
import useToast from "@/hooks/toastHook"

export function buildExtensionComponent(installedExtension: InstalledExtension) {
    function ExtensionComponent() {
        const { showToast } = useToast()
        const player = usePlayer()
        const containerRef = useRef<HTMLDivElement | null>(null)

        useLayoutEffect(() => {
            if (!containerRef.current) {
                return
            }
            installedExtension.position(containerRef.current.getBoundingClientRect())
        }, [])

        useEffect(() => {
            const subscription = player.$events.subscribe(async (event) => {
                switch (event.type) {
                    case "playbackStateDidChange":
                    case "playingItemChanged":
                        installedExtension.extension?.dispatchEvent({
                            type: "Magritte.NowPlayingDidChange",
                        })
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
            installedExtension.loadIfNeeded()
            installedExtension.position(containerRef.current.getBoundingClientRect())
            installedExtension.connect({
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

            return () => {
                installedExtension.unload()
            }
        }, [showToast, player])

        return <div ref={containerRef} className="h-full" />
    }
    return ExtensionComponent
}
