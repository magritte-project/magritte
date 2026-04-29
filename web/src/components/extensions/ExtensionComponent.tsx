import { GearIcon } from "@phosphor-icons/react"
import { useEffect, useLayoutEffect, useRef } from "react"

import type { ExtensionInstance } from "@/extensions/instance"
import type { ExtensionManager } from "@/extensions/manager"

import { exportLibrary } from "@/extensions/exports/Library"
import { exportPlayer } from "@/extensions/exports/Player"
import useAPIClient from "@/hooks/apiClientHook"
import usePlayer from "@/hooks/playerHook"
import useToast from "@/hooks/toastHook"

export function buildExtensionComponent(extensionManager: ExtensionManager, id: string) {
    function ExtensionComponent() {
        const { showToast } = useToast()
        const apiClient = useAPIClient()
        const player = usePlayer()
        const containerRef = useRef<HTMLDivElement | null>(null)
        const instanceRef = useRef<ExtensionInstance | null>(null)

        useLayoutEffect(() => {
            if (!containerRef.current || !instanceRef.current) {
                return
            }
            instanceRef.current.updateClientFrame(containerRef.current.getBoundingClientRect())
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
                exports: {
                    chrome: {
                        showToast: async (options: {
                            message: string
                            type: "error" | "success" | "info"
                        }) => {
                            showToast(options)
                        },
                    },
                    library: exportLibrary(apiClient),
                    player: exportPlayer(player),
                },
            })
            instanceRef.current = instance

            return () => {
                extensionManager.releaseInstance(instance)
            }
        }, [showToast, apiClient, player])

        return (
            <div ref={containerRef} className="h-full flex items-center justify-center">
                <GearIcon size="4rem" weight="light" className="text-gray-200" />
            </div>
        )
    }
    return ExtensionComponent
}
