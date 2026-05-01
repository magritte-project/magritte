import { RPCBroadcaster } from "@magritte/rpc"
import { GearIcon } from "@phosphor-icons/react"
import { useEffect, useRef } from "react"

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

        useEffect(() => {
            if (!containerRef.current) {
                return
            }

            const instance = extensionManager.acquireInstance(id)
            const broadcaster = new RPCBroadcaster()
            instance.load({
                clientFrame: containerRef.current.getBoundingClientRect(),
                broadcaster,
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
                    player: exportPlayer(broadcaster, player),
                },
            })
            instanceRef.current = instance

            const resizeObserver = new ResizeObserver(() => {
                if (!containerRef.current) {
                    return
                }
                instance.updateClientFrame(containerRef.current.getBoundingClientRect())
            })
            resizeObserver.observe(document.body)
            resizeObserver.observe(containerRef.current)

            return () => {
                extensionManager.releaseInstance(instance)
                resizeObserver.disconnect()
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
