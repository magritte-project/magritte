import { APIClient } from "@magritte/api"
import { StorageUserSessionManager } from "@magritte/api"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import { UserEvents } from "@/api/userEvents"
import { CommandInputs } from "@/commands/inputs/base"
import { CommandRegistry } from "@/commands/registry"
import { libraryCommands } from "@/commands/suites/library"
import { playerCommands, wirePlayerCommandInputs } from "@/commands/suites/player"
import {
    wireExtensionCommands,
    wireExtensionPanels,
} from "@/components/extensions/ExtensionComponent"
import AppCommandPaletteContextProvider from "@/contexts/providers/AppCommandPaletteContextProvider"
import { ExtensionRuntime } from "@/extensions/runtime"
import * as TanStackQueryProvider from "@/integrations/tanstack-query/root-provider"
import BuiltInPlaybackEngine from "@/playback/builtInEngine"
import PlaybackEngineRegistry from "@/playback/engineRegistry"
import { LocalCache } from "@/playback/localFileCache"
import { Player } from "@/playback/player"
import reportWebVitals from "@/reportWebVitals"
// Import the generated route tree
import { routeTree } from "@/routeTree.gen"
import { PanelRegistry } from "@/utilities/panelRegistry"

import "@/styles.css"

// Set up user session
const userSession = StorageUserSessionManager.local

// Set up API client
const apiClient = new APIClient({
    baseUrl: import.meta.env.VITE_API_URL,
    userSessionManager: userSession,
})

// Set up commands
const commandInputs = new CommandInputs()
const commandRegistry = new CommandRegistry()

// Set up user events
const userEvents = new UserEvents(apiClient, userSession)

// Set up playback
const localCache = await LocalCache.open()
const playbackEngineRegistry = new PlaybackEngineRegistry({
    defaultEngine: new BuiltInPlaybackEngine(userSession, localCache),
})
const player = new Player(playbackEngineRegistry)

// Set up extensions
const extensionRuntime = new ExtensionRuntime({
    container: document.body,
    commandInputs,
    commandRegistry,
    userSession,
    apiClient,
    player,
})
await extensionRuntime.sync()
playbackEngineRegistry.subscribeTo(extensionRuntime)

// Set up panels
const panelRegistry = new PanelRegistry()
wireExtensionPanels(panelRegistry, extensionRuntime)

// Create a new router instance

const TanStackQueryProviderContext = TanStackQueryProvider.getContext()
const router = createRouter({
    routeTree,
    context: {
        userSession,
        apiClient,
        commandInputs,
        commandRegistry,
        userEvents,
        player,
        extensionRuntime,
        panelRegistry,
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

// Hook up commands
commandRegistry.add(
    ...libraryCommands(
        router,
        apiClient,
        userSession,
        localCache,
        TanStackQueryProviderContext.queryClient,
    ),
)
commandRegistry.add(...playerCommands(player))
wirePlayerCommandInputs(player, commandInputs)
wireExtensionCommands(commandRegistry, extensionRuntime)

// Render the app
const rootElement = document.getElementById("app")
if (rootElement && !rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
        <StrictMode>
            <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
                <AppCommandPaletteContextProvider>
                    <RouterProvider router={router} />
                </AppCommandPaletteContextProvider>
            </TanStackQueryProvider.Provider>
        </StrictMode>,
    )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
