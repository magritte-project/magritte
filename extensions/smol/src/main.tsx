import { ExtensionHost } from "@magritte/sdk"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import "@/index.css"

import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import { createAgent } from "@/agent/agent"
import Extension from "@/components/Extension"
import { ExtensionHostContext } from "@/contexts/extensionHostContext"

import AgentContextProvider from "./contexts/providers/AgentContextProvider"

// Handshake with the extension host
const extensionHost = await ExtensionHost.connect({
    extensionId: "magritte.smol",
}).catch((error) => {
    console.error("*** Could not connect to extension host:", error)
    return Promise.resolve(ExtensionHost.invalid())
})

// Set up agent
const agent = createAgent({ extensionHost })

// Set up query client
const queryClient = new QueryClient()

// Render the app
const rootElement = document.getElementById("app")
if (rootElement && !rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
        <StrictMode>
            <QueryClientProvider client={queryClient}>
                <AgentContextProvider agent={agent}>
                    <ExtensionHostContext.Provider value={extensionHost}>
                        <Extension />
                    </ExtensionHostContext.Provider>
                </AgentContextProvider>
            </QueryClientProvider>
        </StrictMode>,
    )
}
