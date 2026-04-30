import { createRouter, RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import { APIClient } from "@/api/client"
import { UserEvents } from "@/api/userEvents"
import { StorageUserSessionManager } from "@/api/userSession.ts"
import { CommandInputs } from "@/commands/inputs/base"
import { wirePlayerInput } from "@/commands/inputs/playerInput"
import { CommandRegistry } from "@/commands/registry"
import { libraryCommands } from "@/commands/suites/library"
import { playerCommands } from "@/commands/suites/player"
import AppCommandPaletteContextProvider from "@/contexts/providers/AppCommandPaletteContextProvider"
import { ExtensionManager } from "@/extensions/manager"
import * as TanStackQueryProvider from "@/integrations/tanstack-query/root-provider.tsx"
import BuiltInPlaybackEngine from "@/playback/builtInEngine"
import PlaybackEngineRegistry from "@/playback/engineRegistry"
import { Player } from "@/playback/player.ts"
import reportWebVitals from "@/reportWebVitals.ts"
// Import the generated route tree
import { routeTree } from "@/routeTree.gen"
import { AppleMusic } from "@/services/applemusic/services"
import { ServiceRegistry } from "@/services/registry"
import SplitRegistry from "@/splits/registry"
import "@/styles.css"

// Set up user session
const userSession = StorageUserSessionManager.local

// Set up API client
const apiClient = new APIClient(userSession)

// Set up commands
const commandInputs = new CommandInputs()
const commandRegistry = new CommandRegistry()

// Set up extensions
const extensionManager = new ExtensionManager()
// TODO: Don't hard code this
extensionManager.install({
    name: "Apple Music",
    id: "magritte.applemusic",
    version: "0.0.0",
    url: "http://localhost:9292/search/songs?query=bad%20romance",
    permissions: [],
    allowsMultipleInstances: false,
    useCases: [
        {
            type: "split",
            minWidth: "16rem",
            preferredLocation: "end",
        },
    ],
})

// Set up services
const serviceRegistry = new ServiceRegistry(extensionManager, {
    apiClient,
    userSession,
    commandRegistry,
})
await serviceRegistry.addServiceGroup(AppleMusic) // TODO: Don't hard code this

// Set up user events
const userEvents = new UserEvents(apiClient, userSession)

// Set up playback
const player = new Player(
    new PlaybackEngineRegistry({
        serviceRegistry,
        defaultEngine: new BuiltInPlaybackEngine(userSession),
    }),
)

// Set up splits
const splitRegister = new SplitRegistry(extensionManager)

// Create a new router instance

const TanStackQueryProviderContext = TanStackQueryProvider.getContext()
const router = createRouter({
    routeTree,
    context: {
        userSession,
        apiClient,
        commandInputs,
        commandRegistry,
        extensionManager,
        serviceRegistry,
        userEvents,
        player,
        splitRegister,
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
commandRegistry.add(...libraryCommands(router))
commandRegistry.add(...playerCommands(player))
wirePlayerInput(player, commandInputs)

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
