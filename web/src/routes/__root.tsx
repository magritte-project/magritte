import { TanstackDevtools } from "@tanstack/react-devtools"
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"

import Header from "@/components/Header"
import CommandPalette from "@/components/commands/CommandPalette"
import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools"
import type { QueryClient } from "@tanstack/react-query"

export interface MagritteRouterContext {
    readonly queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MagritteRouterContext>()({
    component: () => (
        <>
            <Header />
            <Outlet />
            <CommandPalette />
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
