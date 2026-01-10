import type { QueryClient } from "@tanstack/react-query"

import { TanStackDevtools } from "@tanstack/react-devtools"
import { createRootRouteWithContext } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { z } from "zod"

import type { APIClient } from "@/api/client"
import type { UserSessionManager } from "@/api/userSession"
import type { Player } from "@/playback/player"

import AppCommandPalette from "@/components/AppCommandPalette"
import RootLayout from "@/components/RootLayout"
import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools"

export interface MagritteRouterContext {
    readonly queryClient: QueryClient
    readonly apiClient: APIClient
    readonly userSession: UserSessionManager
    readonly player: Player
}

declare module "@tanstack/react-router" {
    interface StaticDataRouteOption {
        /** Controls whether a route suppresses the split in the normal root layout */
        hideSplit?: boolean
    }
}

export const Route = createRootRouteWithContext<MagritteRouterContext>()({
    validateSearch: z.object({
        split_tab: z.enum(["now_playing", "search"]).optional(),
    }),
    component: function RootComponent() {
        return (
            <>
                <RootLayout />
                <AppCommandPalette />
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
            </>
        )
    },
})
