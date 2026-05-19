import { RPCBroadcaster } from "@magritte/rpc"
import { GearIcon } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"

import { exportLibrary } from "@/extensions/exports/Library"
import { exportPlayer } from "@/extensions/exports/Player"
import type { ExtensionInstance } from "@/extensions/instance"
import type { ExtensionManager } from "@/extensions/manager"
import useAPIClient from "@/hooks/apiClientHook"
import usePlayer from "@/hooks/playerHook"
import useToast from "@/hooks/toastHook"
import useUserSession from "@/hooks/userSessionHook"
import { getErrorMessage } from "@/utilities/errors"

export function buildExtensionComponent(extensionManager: ExtensionManager, id: string) {
    function ExtensionComponent() {
        const { showToast } = useToast()
        const userSession = useUserSession()
        const apiClient = useAPIClient()
        const player = usePlayer()
        const [error, setError] = useState<unknown | null>(null)
        const containerRef = useRef<HTMLDivElement | null>(null)
        const instanceRef = useRef<ExtensionInstance | null>(null)

        useEffect(() => {
            if (!containerRef.current) {
                return
            }

            const instance = extensionManager.acquireInstance(id)

            const loadFaliedSubscription = instance.$events.subscribe((event) => {
                if (event.type === "extensionInstanceLoadFailed") {
                    setError(event.error)
                }
            })

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
                    library: exportLibrary(userSession?.current, apiClient),
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
                loadFaliedSubscription.unsubscribe()
                extensionManager.releaseInstance(instance)
                resizeObserver.disconnect()
            }
        }, [showToast, userSession, apiClient, player])

        return (
            <div
                ref={containerRef}
                className="h-full flex flex-col gap-3 items-center justify-center"
            >
                <GearIcon size="4rem" weight="light" className="text-gray-200" />
                {error !== null && (
                    <div className="px-3 text-center text-sm font-medium text-gray-600">
                        {getErrorMessage(error)}
                    </div>
                )}
            </div>
        )
    }
    return ExtensionComponent
}
