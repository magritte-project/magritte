import { useRouteContext } from "@tanstack/react-router"

import type { PanelRegistry } from "@/utilities/panelRegistry"

export default function usePanelRegistry(): PanelRegistry {
    const panelRegister = useRouteContext({
        from: "__root__",
        select: (context) => context.panelRegistry,
    })
    return panelRegister
}
