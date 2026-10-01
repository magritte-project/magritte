import type { ExtensionManifest } from "@magritte/api"
import { useCallback, useEffect, useRef, useState } from "react"

import ExtensionIcon from "@/components/extensions/ExtensionIcon"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useExtensionRuntime from "@/hooks/extensionRuntimeHook"
import { getErrorMessage } from "@/utilities/errors"

export interface ExtensionComponentProps {
    readonly manifest: ExtensionManifest
}

export default function ExtensionComponent({ manifest }: ExtensionComponentProps) {
    const extensionRuntime = useExtensionRuntime()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [error, setError] = useState<unknown | null>(null)
    const [isLoading, setIsLoading] = useState(() => extensionRuntime.isLoading(manifest.id))
    const [isLoaded, setIsLoaded] = useState(
        () => extensionRuntime.getRunning(manifest.id) !== null,
    )

    useEffect(() => {
        if (!containerRef.current) {
            return
        }

        setIsLoading(extensionRuntime.isLoading(manifest.id))
        const unsubscribe = extensionRuntime.subscribe((event) => {
            switch (event.type) {
                case "extensionLoadStart":
                    if (event.manifest.id === manifest.id) {
                        setError(null)
                        setIsLoading(true)
                    }
                    break
                case "extensionLoaded":
                    if (event.extension.manifest.id === manifest.id) {
                        setError(null)
                        setIsLoading(false)
                        setIsLoaded(true)
                    }
                    break
                case "extensionUnloaded":
                    if (event.extension.manifest.id === manifest.id) {
                        setIsLoading(false)
                        setIsLoaded(false)
                    }
                    break
                case "extensionLoadFailed":
                    if (event.manifest.id === manifest.id) {
                        setIsLoaded(false)
                        setIsLoading(false)
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

    const handleReload = useCallback(() => {
        if (!containerRef.current) {
            return
        }
        extensionRuntime.attach(manifest.id, containerRef.current)
    }, [extensionRuntime, manifest])

    return (
        <div ref={containerRef} className="h-full flex flex-col gap-lg items-center justify-center">
            {/* Extensions may have translucent backgrounds, so the placeholder must not show through */}
            {!isLoaded && (
                <ExtensionIcon iconUrl={manifest.icon_url} name={manifest.name} size="4rem" />
            )}
            {error !== null && (
                <div className="px-lg text-center text-sm font-medium text-on-secondary">
                    {getErrorMessage(error)}
                </div>
            )}
            {!isLoading && (
                <ThemedSubtleButton
                    type="button"
                    className="text-xs font-semibold"
                    onClick={handleReload}
                >
                    Reload
                </ThemedSubtleButton>
            )}
        </div>
    )
}
