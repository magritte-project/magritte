import { TanstackDevtools } from "@tanstack/react-devtools"
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"

import type { UserSessionManager } from "@/api/userSession"
import AppCommandPalette from "@/components/AppCommandPalette"
import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools"
import type { Player } from "@/playback/player"
import type { QueryClient } from "@tanstack/react-query"

export interface MagritteRouterContext {
    readonly queryClient: QueryClient
    readonly userSession: UserSessionManager
    readonly player: Player
}

export const Route = createRootRouteWithContext<MagritteRouterContext>()({
    component: () => (
        <>
            <Outlet />
            <AppCommandPalette />
            <TanstackDevtools
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
        </>
    ),
})
