import type { ExtensionManifest } from "@magritte/api"
import { useEffect, useRef, useState } from "react"

import ExtensionIcon from "@/components/extensions/ExtensionIcon"
import useExtensionRuntime from "@/hooks/extensionRuntimeHook"
import { getErrorMessage } from "@/utilities/errors"

export interface ExtensionComponentProps {
    readonly manifest: ExtensionManifest
}

export default function ExtensionComponent({ manifest }: ExtensionComponentProps) {
    const extensionRuntime = useExtensionRuntime()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [error, setError] = useState<unknown | null>(null)

    useEffect(() => {
        if (!containerRef.current) {
            return
        }

        const unsubscribe = extensionRuntime.$events((event) => {
            switch (event.type) {
                case "extensionLoaded":
                    if (event.extension.manifest.id === manifest.id) {
                        setError(null)
                    }
                    break
                case "extensionLoadFailed":
                    if (event.manifest.id === manifest.id) {
                        setError(event.error)
                    }
                    break
                default:
                    break
            }
        })

        const container = containerRef.current
        extensionRuntime.attach(manifest.id, container)

        return () => {
            extensionRuntime.detach(manifest.id, container)
            unsubscribe()
        }
    }, [extensionRuntime, manifest.id])

    return (
        <div
            ref={containerRef}
            className="h-full flex flex-col gap-between items-center justify-center"
        >
            <ExtensionIcon iconUrl={manifest.icon_url} name={manifest.name} size="4rem" />
            {error !== null && (
                <div className="px-outside text-center text-sm font-medium text-on-secondary">
                    {getErrorMessage(error)}
                </div>
            )}
        </div>
    )
}
