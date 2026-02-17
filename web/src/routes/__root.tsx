import type { QueryClient } from "@tanstack/react-query"

import { TanStackDevtools } from "@tanstack/react-devtools"
import { createRootRouteWithContext } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"

import type { APIClient } from "@/api/client"
import type { UserEvents } from "@/api/userEvents"
import type { UserSessionManager } from "@/api/userSession"
import type { Player } from "@/playback/player"
import type { ServiceRegistry } from "@/services/registry"
import type SplitRegistry from "@/splits/registry"

import AppCommandPalette from "@/components/structure/AppCommandPalette"
import RootLayout from "@/components/structure/RootLayout"
import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools"

export interface MagritteRouterContext {
    readonly queryClient: QueryClient
    readonly userSession: UserSessionManager
    readonly apiClient: APIClient
    readonly serviceRegistry: ServiceRegistry
    readonly userEvents: UserEvents
    readonly player: Player
    readonly splitRegister: SplitRegistry
}

declare module "@tanstack/react-router" {
    interface StaticDataRouteOption {
        /** Controls whether a route suppresses the split in the normal root layout */
        hideSplit?: boolean

        /** Whether a route does not require authentication */
        noAuth?: boolean
    }
}

export const Route = createRootRouteWithContext<MagritteRouterContext>()({
    component: function RootComponent() {
        return (
            <>
                <RootLayout />
                <AppCommandPalette />
                {import.meta.env.DEV && (
                    <TanStackDevtools
                        config={{
                            position: "bottom-left",
                        }}
                        plugins={[
                            {
                                name: "Tanstack Router",
                                render: <TanStackRouterDevtoolsPanel />,
                            },
                            TanStackQueryDevtools,
                        ]}
                    />
                )}
            </>
        )
    },
})
