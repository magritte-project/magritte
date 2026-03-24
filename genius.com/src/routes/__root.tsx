import type { RPCObject } from "@magritte/rpc"
import { createRootRouteWithContext } from "@tanstack/react-router"

import RootLayout from "@/layouts/RootLayout"

export interface GeniusExtensionRouterContext {
    readonly host: RPCObject
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
