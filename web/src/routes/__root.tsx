import { TanStackDevtools } from "@tanstack/react-devtools"
import { createRootRouteWithContext } from "@tanstack/react-router"

import AppPalette from "@/components/structure/AppPalette"
import RootLayout from "@/components/structure/RootLayout"
import HotKeysContextProvider from "@/contexts/providers/HotKeysContextProvider"
import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools"
import type { MagritteRouterContext } from "@/integrations/tanstack-router/context"
import TanStackRouterDevtools from "@/integrations/tanstack-router/devtools"

export const Route = createRootRouteWithContext<MagritteRouterContext>()({
    component: function RootComponent() {
        return (
            <>
                <HotKeysContextProvider>
                    <RootLayout />
                    <AppPalette />
                </HotKeysContextProvider>
                {import.meta.env.DEV && (
                    <TanStackDevtools
                        config={{
                            hideUntilHover: true,
                            position: "bottom-left",
                        }}
                        plugins={[TanStackRouterDevtools, TanStackQueryDevtools]}
                    />
                )}
            </>
        )
    },
})
