import type { ExtensionHostProxy } from "@magritte/sdk/extensions"
import { createRootRouteWithContext } from "@tanstack/react-router"

import RootLayout from "@/layouts/RootLayout"

export interface GeniusExtensionRouterContext {
    readonly host: ExtensionHostProxy
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
