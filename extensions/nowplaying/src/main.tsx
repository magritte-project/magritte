import { ExtensionHost } from "@magritte/sdk/extension"
import { StrictMode } from "react"

import "./index.css"

import ReactDOM from "react-dom/client"

import Extension from "@/components/Extension"
import { ExtensionHostContext } from "@/contexts/extensionHostContext"

// Handshake with the extension host
const extensionHost = await ExtensionHost.connect({
    extensionId: "magritte.nowplaying",
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
