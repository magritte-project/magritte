import { ExtensionHost } from "@magritte/sdk"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import "@/styles.css"
import "@magritte/fonts/fira-go.css"
import "@magritte/fonts/fira-mono.css"

import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import { getDeveloperToken } from "@/actions/getToken.server"
import Extension from "@/components/Extension"
import ContentUnavailable from "@/components/structure/ContentUnavailable"
import { ExtensionHostContext } from "@/contexts/extensionHostContext"
import { MusicKitContext } from "@/contexts/musicKitContext"
import AppleMusicPlaybackEngine from "@/extension/engine"
import AppleMusicCommandResponder from "@/extension/responder"
import AppleMusicSearchResponder from "@/extension/searchResponder"
import { initializeMusicKit } from "@/musickit/initialization"

try {
    // Set up Apple Music API
    const { developerToken } = await getDeveloperToken()
    const musicKit = await initializeMusicKit({
        developerToken,
        app: {
            name: "Magritte",
        },
    })

    // Handshake with the extension host
    const extensionHost = await ExtensionHost.connect({
        extensionId: "magritte.applemusic",
        exports: async ({ broadcaster, host }) => {
            return {
                commandResponder: new AppleMusicCommandResponder(musicKit),
                searchCommandResponder: new AppleMusicSearchResponder(musicKit, host),
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
