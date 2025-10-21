import { RouterProvider, createRouter } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import * as TanStackQueryProvider from "@/integrations/tanstack-query/root-provider.tsx"

// Import the generated route tree
import { routeTree } from "@/routeTree.gen"

import { StorageUserSessionManager } from "@/api/userSession.ts"
import AppCommandPaletteContextProvider from "@/contexts/providers/AppCommandPaletteContextProvider.tsx"
import PlayerContextProvider from "@/contexts/providers/PlayerContextProvider"
import { Player } from "@/playback/player.ts"
import reportWebVitals from "@/reportWebVitals.ts"
import "./styles.css"

// Set up playback
const player = new Player()

// Create a new router instance

const TanStackQueryProviderContext = TanStackQueryProvider.getContext()
const router = createRouter({
    routeTree,
    context: {
        userSession: StorageUserSessionManager.local,
        player,
        ...TanStackQueryProviderContext,
    },
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router
    }
}

// Render the app
const rootElement = document.getElementById("app")
if (rootElement && !rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
        <StrictMode>
            <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
                <PlayerContextProvider value={player}>
                    <AppCommandPaletteContextProvider>
                        <RouterProvider router={router} />
                    </AppCommandPaletteContextProvider>
                </PlayerContextProvider>
            </TanStackQueryProvider.Provider>
        </StrictMode>,
    )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
