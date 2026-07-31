import { TanStackDevtools } from "@tanstack/react-devtools"
import { createRootRouteWithContext } from "@tanstack/react-router"

import AppCommandPalette from "@/components/structure/AppCommandPalette"
import RootLayout from "@/components/structure/RootLayout"
import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools"
import type { MagritteRouterContext } from "@/integrations/tanstack-router/context"
import TanStackRouterDevtools from "@/integrations/tanstack-router/devtools"

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
                            TanStackRouterDevtools,
                            TanStackQueryDevtools,
                        ]}
                    />
                )}
            </>
        )
    },
})
