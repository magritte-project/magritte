import { createAPI } from "@magritte/api"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import { CommandInputs } from "@/commands/inputs/base"
import { CommandRegistry } from "@/commands/registry"
import { LibraryAlbumsSearchCommand } from "@/commands/searchCommands/libraryAlbums"
import { LibraryArtistsSearchCommand } from "@/commands/searchCommands/libraryArtists"
import { LibrarySongsSearchCommand } from "@/commands/searchCommands/librarySongs"
import { SearchRegistry } from "@/commands/searchRegistry"
import { libraryCommands } from "@/commands/suites/library"
import { playerCommands, wirePlayerCommandInputs } from "@/commands/suites/player"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import AppPaletteContextProvider from "@/contexts/providers/AppPaletteContextProvider"
import { ExtensionRuntime } from "@/extensions/runtime"
import { createMagritteRouter } from "@/integrations/tanstack-router/context"
import { NotificationCenter } from "@/notifications/center"
import BuiltInPlaybackEngine from "@/playback/builtInEngine"
import PlaybackEngineRegistry from "@/playback/engineRegistry"
import { LocalCache } from "@/playback/localFileCache"
import { connectMediaSession } from "@/playback/mediaSession"
import { PlaybackEventRecorder } from "@/playback/playbackEventRecorder"
import { Player } from "@/playback/player"
import reportWebVitals from "@/reportWebVitals"

import "@/styles.css"

try {
    // Set up API client
    const api = createAPI({
        baseUrl: import.meta.env.VITE_API_URL,
    })
    const queryClient = new QueryClient()

    // Set up commands
    const commandInputs = new CommandInputs()
    const commandRegistry = new CommandRegistry()

    // Set up search
    const searchRegistry = new SearchRegistry()

    // Set up user events
    const notificationCenter = new NotificationCenter(queryClient, api)

    // Set up playback
    const localCache = await LocalCache.open()
    const playbackEngineRegistry = new PlaybackEngineRegistry({
        defaultEngine: new BuiltInPlaybackEngine(api, localCache),
    })
    const player = new Player(playbackEngineRegistry)
    const playbackEventRecorder = await PlaybackEventRecorder.open({ api })
    playbackEventRecorder.wireUpPlayer(player)

    // Set up extensions
    const extensionRuntime = new ExtensionRuntime({
        container: document.body,
        commandInputs,
        commandRegistry,
        queryClient,
        api,
        notificationCenter,
        player,
    })
    await extensionRuntime.sync()
    playbackEngineRegistry.wireUpExtensions(extensionRuntime)

    // Create a new router instance
    const router = createMagritteRouter({
        api,
        commandInputs,
        commandRegistry,
        searchRegistry,
        extensionRuntime,
        localCache,
        notificationCenter,
        player,
        queryClient,
    })

    // Hook up commands
    commandRegistry.add(...libraryCommands(router))
    commandRegistry.add(...playerCommands(router))
    wirePlayerCommandInputs(player, commandInputs)
    commandRegistry.wireUpExtensions(extensionRuntime)
    connectMediaSession(api, player)

    // Hook up search
    searchRegistry.add(new LibrarySongsSearchCommand({ api, player, router }))
    searchRegistry.add(new LibraryAlbumsSearchCommand({ api, router }))
    searchRegistry.add(new LibraryArtistsSearchCommand({ api, router }))
    searchRegistry.wireUpExtensions(extensionRuntime)

    // Render the app
    const rootElement = document.getElementById("app")
    if (rootElement && !rootElement.innerHTML) {
        const root = ReactDOM.createRoot(rootElement)
        root.render(
            <StrictMode>
                <QueryClientProvider client={queryClient}>
                    <AppPaletteContextProvider>
                        <RouterProvider router={router} />
                    </AppPaletteContextProvider>
                </QueryClientProvider>
            </StrictMode>,
        )
    }

    // If you want to start measuring performance in your app, pass a function
    // to log results (for example: reportWebVitals(console.log))
    // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
    reportWebVitals()
} catch (error) {
    const rootElement = document.getElementById("app")
    if (rootElement && !rootElement.innerHTML) {
        const root = ReactDOM.createRoot(rootElement)
        root.render(
            <ThemedContentUnavailable error={error} onRetry={() => window.location.reload()} />,
        )
    }
}
