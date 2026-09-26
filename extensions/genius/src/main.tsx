import { ExtensionHost } from "@magritte/sdk"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"

import "@/index.css"
import ReactDOM from "react-dom/client"

import Extension from "@/components/Extension"
import ContentUnavailable from "@/components/reusable/ContentUnavailable"
import { ExtensionHostContext } from "@/contexts/extensionHostContext"

try {
    // Handshake with the extension host
    const extensionHost = await ExtensionHost.connect({
        extensionId: "magritte.genius",
    })

    // Set up tanstack query
    const queryClient = new QueryClient()

    // Render the app
    const rootElement = document.getElementById("app")
    if (rootElement && !rootElement.innerHTML) {
        const root = ReactDOM.createRoot(rootElement)
        root.render(
            <StrictMode>
                <QueryClientProvider client={queryClient}>
                    <ExtensionHostContext.Provider value={extensionHost}>
                        <Extension />
                    </ExtensionHostContext.Provider>
                </QueryClientProvider>
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
