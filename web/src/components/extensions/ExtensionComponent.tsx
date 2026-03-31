import { GearIcon } from "@phosphor-icons/react/dist/ssr"
import { useEffect, useLayoutEffect, useRef } from "react"

import { ExtensionInstance, ExtensionManager } from "@/extensions/extensionManager"
import usePlayer from "@/hooks/playerHook"
import useToast from "@/hooks/toastHook"

export function buildExtensionComponent(extensionManager: ExtensionManager, id: string) {
    function ExtensionComponent() {
        const { showToast } = useToast()
        const player = usePlayer()
        const containerRef = useRef<HTMLDivElement | null>(null)
        const instanceRef = useRef<ExtensionInstance | null>(null)

        useLayoutEffect(() => {
            if (!containerRef.current || !instanceRef.current) {
                return
            }
            instanceRef.current.position(containerRef.current.getBoundingClientRect())
        }, [])

        useEffect(() => {
            const subscription = player.$events.subscribe(async (event) => {
                switch (event.type) {
                    case "playbackStateDidChange":
                    case "playingItemChanged":
                        instanceRef.current?.extension?.dispatchEvent({
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

            const instance = extensionManager.acquireInstance(id)
            instance.load({
                clientFrame: containerRef.current.getBoundingClientRect(),
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
            instanceRef.current = instance

            return () => {
                extensionManager.releaseInstance(instance)
            }
        }, [showToast, player])

        return (
            <div ref={containerRef} className="h-full flex items-center justify-center">
                <GearIcon size="4rem" weight="light" className="text-gray-200" />
            </div>
        )
    }
    return ExtensionComponent
}
