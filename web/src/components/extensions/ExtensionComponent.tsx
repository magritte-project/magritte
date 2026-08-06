import { GearIcon } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"

import useExtensionRuntime from "@/hooks/extensionRuntimeHook"
import { getErrorMessage } from "@/utilities/errors"

export interface ExtensionComponentProps {
    readonly extensionId: string
}

export default function ExtensionComponent({ extensionId }: ExtensionComponentProps) {
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
                    if (event.extension.manifest.id === extensionId) {
                        setError(null)
                    }
                    break
                case "extensionLoadFailed":
                    if (event.manifest.id === extensionId) {
                        setError(event.error)
                    }
                    break
                default:
                    break
            }
        })

        const container = containerRef.current
        extensionRuntime.attach(extensionId, container)

        return () => {
            extensionRuntime.detach(extensionId, container)
            subscription.unsubscribe()
        }
    }, [extensionRuntime, extensionId])

    return (
        <div
            ref={containerRef}
            className="h-full flex flex-col gap-between items-center justify-center"
        >
            <GearIcon size="4rem" weight="light" className="text-placeholder" />
            {error !== null && (
                <div className="px-outside text-center text-sm font-medium text-on-secondary">
                    {getErrorMessage(error)}
                </div>
            )}
        </div>
    )
}
