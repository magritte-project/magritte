import { RPCBroadcaster } from "@magritte/rpc"
import type { HostExports } from "@magritte/sdk/connection"
import { GearIcon } from "@phosphor-icons/react"
import { useEffect, useMemo, useRef, useState } from "react"

import { exportLibrary } from "@/extensions/exports/Library"
import { exportPlayer } from "@/extensions/exports/Player"
import type { ExtensionManager } from "@/extensions/manager"
import useAPIClient from "@/hooks/apiClientHook"
import useExtensionInstance from "@/hooks/extensionInstanceHook"
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

        const instance = useExtensionInstance(id)

        useEffect(() => {
            if (!containerRef.current) {
                return
            }
            // TODO: error handling
            const container = containerRef.current
            instance.pushAnchor(container)

            const broadcaster = new RPCBroadcaster()
            instance.load({
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
            }).catch((error) => {
                setError(error)
                return Promise.reject(error)
            })
            return () => {
                instance.removeAnchor(container)
                instance.unload()
            }
        }, [instance])
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
