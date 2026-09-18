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
    const [isLoaded, setIsLoaded] = useState(
        () => extensionRuntime.getRunning(manifest.id) !== null,
    )

    useEffect(() => {
        if (!containerRef.current) {
            return
        }

        setIsLoaded(extensionRuntime.getRunning(manifest.id) !== null)
        const unsubscribe = extensionRuntime.subscribe((event) => {
            switch (event.type) {
                case "extensionLoaded":
                    if (event.extension.manifest.id === manifest.id) {
                        setError(null)
                        setIsLoaded(true)
                    }
                    break
                case "extensionUnloaded":
                    if (event.extension.manifest.id === manifest.id) {
                        setIsLoaded(false)
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
            {/* Extensions may have translucent backgrounds, so the placeholder must not show through */}
            {!isLoaded && (
                <ExtensionIcon iconUrl={manifest.icon_url} name={manifest.name} size="4rem" />
            )}
            {error !== null && (
                <div className="px-outside text-center text-sm font-medium text-on-secondary">
                    {getErrorMessage(error)}
                </div>
            )}
        </div>
    )
}
