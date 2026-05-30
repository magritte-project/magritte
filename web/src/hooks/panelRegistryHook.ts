import { useRouteContext } from "@tanstack/react-router"
import { useSyncExternalStore } from "react"

import { type PanelDefinition } from "@/utilities/panelRegistry"

export interface UsePanelRegistryResult {
    readonly panels: readonly PanelDefinition[]
}

export default function usePanelRegistry(): UsePanelRegistryResult {
    const panelRegistry = useRouteContext({
        from: "__root__",
        select: (context) => context.panelRegistry,
    })
    const panels = useSyncExternalStore(
        (onStoreChange) => {
            const subscription = panelRegistry.$events.subscribe((event) => {
                switch (event.type) {
                    case "panelRegistered":
                    case "panelUnregistered":
                        onStoreChange()
                        break
                    default:
                        break
                }
            })
            return () => subscription.unsubscribe()
        },
        () => panelRegistry.definitions,
    )
    return { panels }
}
