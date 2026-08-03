import type { ExtensionManifest } from "@magritte/api"
import { GearIcon } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"

import useExtensionRuntime from "@/hooks/extensionRuntimeHook"
import { getErrorMessage } from "@/utilities/errors"
import type { PanelDefinition } from "@/utilities/panelRegistry"

import ExtensionIcon from "./ExtensionIcon"

export function buildExtensionComponent(id: string) {
    function ExtensionComponent() {
        const extensionRuntime = useExtensionRuntime()
        const containerRef = useRef<HTMLDivElement | null>(null)
        const [error, setError] = useState<unknown | null>(null)

        useEffect(() => {
            if (!containerRef.current) {
                return
            }

            const subscription = extensionRuntime.$events.subscribe((event) => {
                switch (event.type) {
                    case "extensionLoaded":
                        if (event.extension.manifest.id === id) {
                            setError(null)
                        }
                        break
                    case "extensionLoadFailed":
                        if (event.manifest.id === id) {
                            setError(event.error)
                        }
                        break
                    default:
                        break
                }
            })

            const container = containerRef.current
            extensionRuntime.attach(id, container)

            return () => {
                extensionRuntime.detach(id, container)
                subscription.unsubscribe()
            }
        }, [extensionRuntime])

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

export function getExtensionPanelID(manifest: ExtensionManifest): string {
    return `extension.${manifest.id}`
}

export function getExtensionPanelDefinition(manifest: ExtensionManifest): PanelDefinition {
    return {
        id: getExtensionPanelID(manifest),
        name: manifest.name,
        icon: <ExtensionIcon iconUrl={manifest.icon_url} name={manifest.name} />,
        preferredWidth: manifest.preferredWidth ?? undefined,
        preferredHeight: manifest.preferredHeight ?? undefined,
        component: buildExtensionComponent(manifest.id),
    }
}
