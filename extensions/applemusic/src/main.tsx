import { ExtensionHost } from "@magritte/sdk"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import "@/styles.css"

import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import Extension from "@/components/Extension"
import ContentUnavailable from "@/components/structure/ContentUnavailable"
import { ExtensionHostContext } from "@/contexts/extensionHostContext"
import { MusicKitContext } from "@/contexts/musicKitContext"
import AppleMusicPlaybackEngine from "@/extension/engine"
import AppleMusicCommandResponder from "@/extension/responder"
import { initializeMusicKit } from "@/musickit/initialization"
import { createDefaultClientTokenFactory } from "@/musickit/tokens/default"

try {
    // Set up Apple Music API
    const tokenFactory = createDefaultClientTokenFactory()
    const developerToken = await tokenFactory.createDeveloperToken()
    const musicKit = await initializeMusicKit({
        developerToken,
        app: {
            name: "Magritte",
        },
    })

    // Handshake with the extension host
    const extensionHost = await ExtensionHost.connect({
        extensionId: "magritte.applemusic",
        exports: async ({ broadcaster }) => {
            return {
                commandResponder: new AppleMusicCommandResponder(musicKit),
                playbackEngine: new AppleMusicPlaybackEngine(broadcaster, musicKit),
            }
        },
    })

    // Set up tanstack query
    const queryClient = new QueryClient()

    // Render the app
    const rootElement = document.getElementById("app")
    if (rootElement && !rootElement.innerHTML) {
        const root = ReactDOM.createRoot(rootElement)
        root.render(
            <StrictMode>
                <ExtensionHostContext.Provider value={extensionHost}>
                    <MusicKitContext.Provider value={musicKit}>
                        <QueryClientProvider client={queryClient}>
                            <Extension />
                        </QueryClientProvider>
                    </MusicKitContext.Provider>
                </ExtensionHostContext.Provider>
            </StrictMode>,
        )
    }
} catch (error) {
    // Render the error state
    const rootElement = document.getElementById("app")
    if (rootElement && !rootElement.innerHTML) {
        const root = ReactDOM.createRoot(rootElement)
        root.render(
            <StrictMode>
                <ContentUnavailable error={error} />
            </StrictMode>,
        )
    }
}
