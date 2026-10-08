import { ExtensionHost } from "@magritte/sdk"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import "@/styles.css"

import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import Extension from "@/components/Extension"
import ContentUnavailable from "@/components/structure/ContentUnavailable"
import { ExtensionHostContext } from "@/contexts/extensionHostContext"
import { YouTubeContext, type YouTube } from "@/contexts/youtubeContext"
import { LookupCache } from "@/youtube/cache"
import { YouTubeClient } from "@/youtube/client"

function render(children: React.ReactNode) {
    const rootElement = document.getElementById("app")
    if (rootElement && !rootElement.innerHTML) {
        ReactDOM.createRoot(rootElement).render(<StrictMode>{children}</StrictMode>)
    }
}

try {
    const youtube: YouTube = {
        client: new YouTubeClient({ apiKey: import.meta.env.VITE_YOUTUBE_API_KEY ?? "" }),
        cache: new LookupCache(),
    }

    // Handshake with the extension host
    const extensionHost = await ExtensionHost.connect({ extensionId: "magritte.youtube" })

    // Set up tanstack query. A song's video does not change while the panel is
    // open, and refetching on focus would spend the search quota for nothing
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
            <YouTubeContext.Provider value={youtube}>
                <QueryClientProvider client={queryClient}>
                    <Extension />
                </QueryClientProvider>
            </YouTubeContext.Provider>
        </ExtensionHostContext.Provider>,
    )
} catch (error) {
    // Render the error state
    console.error("*** Could not start the YouTube extension", error)
    render(<ContentUnavailable error={error} />)
}
