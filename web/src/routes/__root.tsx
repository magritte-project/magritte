import type { APIClient } from "@magritte/api"
import type { UserSessionManager } from "@magritte/api"
import { TanStackDevtools } from "@tanstack/react-devtools"
import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"

import type { UserEvents } from "@/api/userEvents"
import type { CommandInputs } from "@/commands/inputs/base"
import type { CommandRegistry } from "@/commands/registry"
import AppCommandPalette from "@/components/structure/AppCommandPalette"
import RootLayout from "@/components/structure/RootLayout"
import type { ExtensionRuntime } from "@/extensions/runtime"
import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools"
import type { Player } from "@/playback/player"
import type { PanelRegistry } from "@/utilities/panelRegistry"

export interface MagritteRouterContext {
    readonly queryClient: QueryClient
    readonly userSession: UserSessionManager
    readonly apiClient: APIClient
    readonly commandInputs: CommandInputs
    readonly commandRegistry: CommandRegistry
    readonly userEvents: UserEvents
    readonly player: Player
    readonly extensionRuntime: ExtensionRuntime
    readonly panelRegistry: PanelRegistry
}

declare module "@tanstack/react-router" {
    interface StaticDataRouteOption {
        /** Controls a route wants to use the full page layout */
        wantsFullPageLayout?: boolean

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
