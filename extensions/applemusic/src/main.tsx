import { RPCBroadcaster } from "@magritte/rpc"
import { ExtensionHost } from "@magritte/sdk"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import "@/styles.css"

import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import Extension from "@/components/Extension"
import { ExtensionHostContext } from "@/contexts/extensionHostContext"
import { MusicKitContext } from "@/contexts/musicKitContext"
import AppleMusicPlaybackEngine from "@/extension/engine"
import { initializeMusicKit } from "@/musickit/initialization"
import { createDefaultClientTokenFactory } from "@/musickit/tokens/default"

// Set up Apple Music API
const tokenFactory = createDefaultClientTokenFactory()
const developerToken = await tokenFactory.createDeveloperToken()
const musicKit = await initializeMusicKit({
    developerToken,
    app: {
        name: "Magritte",
    },
})
const broadcaster = new RPCBroadcaster()
const playbackEngine = new AppleMusicPlaybackEngine(broadcaster, musicKit)

// Handshake with the extension host
const extensionHost = await ExtensionHost.connect({
    extensionId: "magritte.applemusic",
    broadcaster,
    exports: {
        playbackEngine,
    },
}).catch((error) => {
    console.error("*** Could not connect to extension host", error)
    return ExtensionHost.invalid()
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
