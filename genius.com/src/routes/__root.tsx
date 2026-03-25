import type { ExtensionHost } from "@magritte/sdk/connection"
import { createRootRouteWithContext } from "@tanstack/react-router"

import RootLayout from "@/layouts/RootLayout"

export interface GeniusExtensionRouterContext {
    readonly extensionHost: ExtensionHost
}

declare module "@tanstack/react-router" {
    interface StaticDataRouteOption {}
}

export const Route = createRootRouteWithContext<GeniusExtensionRouterContext>()({
    component: function RootComponent() {
        return (
            <>
                <RootLayout />
            </>
        )
    },
})
