import { createAPI } from "@magritte/api"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import { CommandInputs } from "@/commands/inputs/base"
import { CommandRegistry } from "@/commands/registry"
import { libraryCommands } from "@/commands/suites/library"
import { playerCommands, wirePlayerCommandInputs } from "@/commands/suites/player"
import AppCommandPaletteContextProvider from "@/contexts/providers/AppCommandPaletteContextProvider"
import { ExtensionRuntime } from "@/extensions/runtime"
import { createMagritteRouter } from "@/integrations/tanstack-router/context"
import { NotificationCenter } from "@/notifications/center"
import BuiltInPlaybackEngine from "@/playback/builtInEngine"
import PlaybackEngineRegistry from "@/playback/engineRegistry"
import { LocalCache } from "@/playback/localFileCache"
import { Player } from "@/playback/player"
import reportWebVitals from "@/reportWebVitals"
import { PanelRegistry } from "@/utilities/panelRegistry"

import "@/styles.css"

// Set up API client
const api = createAPI({
    baseUrl: import.meta.env.VITE_API_URL,
})
const queryClient = new QueryClient()

// Set up commands
const commandInputs = new CommandInputs()
const commandRegistry = new CommandRegistry()

// Set up user events
const notificationCenter = new NotificationCenter(queryClient, api)

// Set up playback
const localCache = await LocalCache.open()
const playbackEngineRegistry = new PlaybackEngineRegistry({
    defaultEngine: new BuiltInPlaybackEngine(api, localCache),
})
const player = new Player(playbackEngineRegistry)

// Set up extensions
const extensionRuntime = new ExtensionRuntime({
    container: document.body,
    commandInputs,
    commandRegistry,
    api,
    notificationCenter,
    player,
})
await extensionRuntime.sync()
playbackEngineRegistry.wireUpExtensions(extensionRuntime)

// Set up panels
const panelRegistry = new PanelRegistry()
panelRegistry.wireUpExtensions(extensionRuntime)

// Create a new router instance
const router = createMagritteRouter({
    api,
    commandInputs,
    commandRegistry,
    extensionRuntime,
    notificationCenter,
    panelRegistry,
    player,
    queryClient,
})

// Hook up commands
commandRegistry.add(...libraryCommands(router, api, localCache, notificationCenter, queryClient))
commandRegistry.add(...playerCommands(player))
wirePlayerCommandInputs(player, commandInputs)
commandRegistry.wireUpExtensions(extensionRuntime)

// Render the app
const rootElement = document.getElementById("app")
if (rootElement && !rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
        <StrictMode>
            <QueryClientProvider client={queryClient}>
                <AppCommandPaletteContextProvider>
                    <RouterProvider router={router} />
                </AppCommandPaletteContextProvider>
            </QueryClientProvider>
        </StrictMode>,
    )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
