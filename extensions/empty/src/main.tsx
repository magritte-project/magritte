import { getErrorMessage } from "@magritte/rpc"
import { beginForwardingMeaningfulUIEvents, ExtensionHost } from "@magritte/sdk"
import { StrictMode } from "react"

import "@/index.css"
import ReactDOM from "react-dom/client"

import App from "@/App.tsx"

try {
    // Handshake with the extension host
    const extensionHost = await ExtensionHost.connect({
        extensionId: "magritte.empty",
    })

    // Set up UI event forwarding
    await beginForwardingMeaningfulUIEvents(extensionHost)

    // Render the app
    const rootElement = document.getElementById("app")
    if (rootElement && !rootElement.innerHTML) {
        const root = ReactDOM.createRoot(rootElement)
        root.render(
            <StrictMode>
                <App />
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
                <h1>Error</h1>
                <p>{getErrorMessage(error)}</p>
            </StrictMode>,
        )
    }
}
