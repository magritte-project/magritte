import { type ExtensionManifest } from "@magritte/sdk"
import { Extension, waitForExtensionConnection } from "@magritte/sdk/connection"
import { useEffect, useLayoutEffect, useRef } from "react"

import useExtensionManager from "@/hooks/extensionsManagerHook"
import usePlayer from "@/hooks/playerHook"
import useToast from "@/hooks/toastHook"

export function buildExtensionComponent(manifest: ExtensionManifest) {
    function ExtensionComponent() {
        const { showToast } = useToast()
        const player = usePlayer()
        const extensionManager = useExtensionManager()
        const containerRef = useRef<HTMLDivElement | null>(null)
        const extensionRef = useRef<Extension | null>(null)

        useLayoutEffect(() => {
            if (!containerRef.current) {
                return
            }
            extensionManager.position(manifest.id, containerRef.current.getBoundingClientRect())
        }, [extensionManager])

        useEffect(() => {
            const subscription = player.$events.subscribe(async (event) => {
                switch (event.type) {
                    case "playbackStateDidChange":
                    case "playingItemChanged":
                        extensionRef.current?.dispatchEvent({
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
            const iframe = extensionManager.load(manifest.id)
            extensionManager.position(manifest.id, containerRef.current.getBoundingClientRect())
            ;(async () => {
                const extension = await waitForExtensionConnection({
                    iframe,
                    manifest,
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
            return () => {
                extensionManager.unload(manifest.id)
            }
        }, [showToast, player, extensionManager])

        return <div ref={containerRef} className="h-full" />
    }
    return ExtensionComponent
}
