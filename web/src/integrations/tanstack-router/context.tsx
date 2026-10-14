import type { API } from "@magritte/api"
import type { QueryClient } from "@tanstack/react-query"
import { createRouter, type RegisteredRouter } from "@tanstack/react-router"

import type { CommandInputs } from "@/commands/inputs/base"
import type { CommandRegistry } from "@/commands/registry"
import type { SearchRegistry } from "@/commands/searchRegistry"
import type { ExtensionRuntime } from "@/extensions/runtime"
import type { NotificationCenter } from "@/notifications/center"
import type { LocalCache } from "@/playback/localFileCache"
import type { Player } from "@/playback/player"
// Import the generated route tree
import { routeTree } from "@/routeTree.gen"
import { poll } from "@/utilities/promises"

export interface MagritteRouterContext {
    readonly api: API
    readonly commandInputs: CommandInputs
    readonly commandRegistry: CommandRegistry
    readonly searchRegistry: SearchRegistry
    readonly extensionRuntime: ExtensionRuntime
    readonly localCache: LocalCache
    readonly notificationCenter: NotificationCenter
    readonly player: Player
    readonly queryClient: QueryClient
}

export function createMagritteRouter(context: MagritteRouterContext) {
    const router = createRouter({
        routeTree,
        context,
        defaultPreload: "intent",
        scrollRestoration: true,
        scrollToTopSelectors: [".router-scroll-to-top"],
        defaultStructuralSharing: true,
        defaultPreloadStaleTime: 0,
    })

    context.api.client.subscribe(async (event) => {
        // NOTE: Must poll since we make API calls before the router is fully set up
        const matches = await poll(() => router.state.matches, {
            test: (matches) => matches.length > 0,
        })
        if (
            event.type === "unauthorized" &&
            !matches.some((match) => match.staticData.noAuth === true)
        ) {
            const currentLocation = router.state.location.href
            router.navigate({
                to: "/sign-in",
                search: { redirect_to: currentLocation },
            })
        }
    })

    return router
}

export function getMagritteRouterContext(router: RegisteredRouter): MagritteRouterContext {
    const root = router.state.matches.find((m) => m.routeId === "__root__")
    if (import.meta.env.DEV && !root) {
        throw new Error("Could not find __root__ in matched routes")
    }
    return root!.context
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

        /** Controls whether the transport controls should be hidden */
        hideTransportControls?: boolean
    }
}
