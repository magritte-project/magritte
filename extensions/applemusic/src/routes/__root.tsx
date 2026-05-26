import type { ExtensionHost } from "@magritte/sdk"
import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext } from "@tanstack/react-router"

import RootLayout from "@/components/layouts/RootLayout"

export interface MagritteAppleMusicExtensionRouterContext {
    readonly queryClient: QueryClient
    readonly musicKit: MusicKit.Instance
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
