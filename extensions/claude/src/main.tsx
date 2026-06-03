import { ExtensionHost } from "@magritte/sdk"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import "@/index.css"

import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import ContentUnavailable from "@/components/ContentUnavailable"
import Extension from "@/components/Extension"
import { ExtensionHostContext } from "@/contexts/extensionHostContext"

try {
    // Handshake with the extension host
    const extensionHost = await ExtensionHost.connect({
        extensionId: "magritte.claude",
    })

    // Set up query client
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
