import type { APIClient, UserSessionManager } from "@magritte/api"
import type { QueryClient } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"

import type { UserEvents } from "@/api/userEvents"
import type { CommandInputs } from "@/commands/inputs/base"
import type { CommandRegistry } from "@/commands/registry"
import type { ExtensionRuntime } from "@/extensions/runtime"
import type { Player } from "@/playback/player"
// Import the generated route tree
import { routeTree } from "@/routeTree.gen"
import type { PanelRegistry } from "@/utilities/panelRegistry"

export interface MagritteRouterContext {
    readonly apiClient: APIClient
    readonly commandInputs: CommandInputs
    readonly commandRegistry: CommandRegistry
    readonly extensionRuntime: ExtensionRuntime
    readonly panelRegistry: PanelRegistry
    readonly player: Player
    readonly queryClient: QueryClient
    readonly userEvents: UserEvents
    readonly userSession: UserSessionManager
}

export function createMagritteRouter(context: MagritteRouterContext) {
    return createRouter({
        routeTree,
        context,
        defaultPreload: "intent",
        scrollRestoration: true,
        defaultStructuralSharing: true,
        defaultPreloadStaleTime: 0,
    })
}

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof createMagritteRouter>
    }
}

declare module "@tanstack/react-router" {
    interface StaticDataRouteOption {
        /** Controls a route wants to use the full page layout */
        wantsFullPageLayout?: boolean

        /** Whether a route does not require authentication */
        noAuth?: boolean
    }
}
