import type { ExtensionHost } from "@magritte/sdk/connection"
import { createRootRouteWithContext } from "@tanstack/react-router"

import RootLayout from "@/layouts/RootLayout"

export interface MagritteAppleMusicExtensionRouterContext {
    readonly extensionHost: ExtensionHost
}

declare module "@tanstack/react-router" {
    interface StaticDataRouteOption {}
}

export const Route = createRootRouteWithContext<MagritteAppleMusicExtensionRouterContext>()({
    component: function RootComponent() {
        return (
            <>
                <RootLayout />
            </>
        )
    },
})
