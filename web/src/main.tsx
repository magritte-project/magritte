import { RouterProvider, createRouter } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import * as TanStackQueryProvider from "@/integrations/tanstack-query/root-provider.tsx"

// Import the generated route tree
import { routeTree } from "@/routeTree.gen"

import { APIClient } from "@/api/client"
import type { SongRead } from "@/api/openapi"
import { StorageUserSessionManager } from "@/api/userSession.ts"
import APIClientContextProvider from "@/contexts/providers/APIClientContextProvider"
import AppCommandPaletteContextProvider from "@/contexts/providers/AppCommandPaletteContextProvider.tsx"
import PlayerContextProvider from "@/contexts/providers/PlayerContextProvider"
import PlaybackEngineRegistry from "@/playback/engineRegistry"
import WebPlaybackEngine from "@/playback/engines/web"
import { Player } from "@/playback/player.ts"
import reportWebVitals from "@/reportWebVitals.ts"
import { ServiceRegistry } from "@/services/registry"
import "@/styles.css"
import ServiceRegistryContextProvider from "@/contexts/providers/ServiceRegistryContextProvider"
import AppleMusicPlaybackEngine from "@/playback/engines/applemusic"

// Set up user session
const userSession = StorageUserSessionManager.local

// Set up API client
const apiClient = new APIClient(userSession)

// Set up services registry
const servicesRegistry = new ServiceRegistry(apiClient)

// Set up playback
const player = new Player(
    new PlaybackEngineRegistry<SongRead>()
        .installPlaybackEngine(new WebPlaybackEngine(userSession))
        .installPlaybackEngine(new AppleMusicPlaybackEngine()),
)

// Create a new router instance

const TanStackQueryProviderContext = TanStackQueryProvider.getContext()
const router = createRouter({
    routeTree,
    context: {
        userSession,
        apiClient,
        player,
        servicesRegistry,
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
                <APIClientContextProvider value={apiClient}>
                    <ServiceRegistryContextProvider value={servicesRegistry}>
                        <PlayerContextProvider value={player}>
                            <AppCommandPaletteContextProvider>
                                <RouterProvider router={router} />
                            </AppCommandPaletteContextProvider>
                        </PlayerContextProvider>
                    </ServiceRegistryContextProvider>
                </APIClientContextProvider>
            </TanStackQueryProvider.Provider>
        </StrictMode>,
    )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
