import { ExtensionHost } from "@magritte/sdk"
import { StrictMode } from "react"

import "@/index.css"

import ReactDOM from "react-dom/client"

import ContentUnavailable from "@/components/ContentUnavailable"
import Extension from "@/components/Extension"
import { ExtensionHostContext } from "@/contexts/extensionHostContext"

try {
    // Handshake with the extension host
    const extensionHost = await ExtensionHost.connect({
        extensionId: "magritte.claude",
    })

    // Render the app
    const rootElement = document.getElementById("app")
    if (rootElement && !rootElement.innerHTML) {
        const root = ReactDOM.createRoot(rootElement)
        root.render(
            <StrictMode>
                <ExtensionHostContext.Provider value={extensionHost}>
                    <Extension />
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
