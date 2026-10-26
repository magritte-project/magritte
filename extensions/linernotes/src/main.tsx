import { ExtensionHost } from "@magritte/sdk"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import "@magritte/fonts/fira-go.css"
import "@/styles.css"

import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import Extension from "@/components/Extension"
import ContentUnavailable from "@/components/structure/ContentUnavailable"
import { ClientsContext, type Clients } from "@/contexts/clientsContext"
import { ExtensionHostContext } from "@/contexts/extensionHostContext"
import { LastfmClient } from "@/lastfm/client"
import { MusicBrainzClient } from "@/musicbrainz/client"
import { WikipediaClient } from "@/wikipedia/client"

function render(children: React.ReactNode) {
    const rootElement = document.getElementById("app")
    if (rootElement && !rootElement.innerHTML) {
        ReactDOM.createRoot(rootElement).render(<StrictMode>{children}</StrictMode>)
    }
}

try {
    // One MusicBrainz client for the whole extension, so its rate limit is shared
    const clients: Clients = {
        musicbrainz: new MusicBrainzClient(),
        wikipedia: new WikipediaClient(),
        // Last.fm is optional: without a key its lookups are simply skipped
        lastfm: new LastfmClient({ apiKey: import.meta.env.VITE_LASTFM_API_KEY ?? "" }),
    }

    // Handshake with the extension host
    const extensionHost = await ExtensionHost.connect({ extensionId: "magritte.linernotes" })

    // Set up tanstack query. Nothing here changes while the panel is open, and
    // refetching on focus would spend the MusicBrainz rate limit for nothing
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
            },
        },
    })

    // Render the app
    render(
        <ExtensionHostContext.Provider value={extensionHost}>
            <ClientsContext.Provider value={clients}>
                <QueryClientProvider client={queryClient}>
                    <Extension />
                </QueryClientProvider>
            </ClientsContext.Provider>
        </ExtensionHostContext.Provider>,
    )
} catch (error) {
    // Render the error state
    console.error("*** Could not start the Liner Notes extension", error)
    render(<ContentUnavailable error={error} />)
}
