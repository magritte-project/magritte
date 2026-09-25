import type { ExtensionHost } from "@magritte/sdk"
import { useContext } from "react"

import { ExtensionHostContext } from "@/contexts/extensionHostContext"

export default function useExtensionHost(): ExtensionHost {
    const extensionHost = useContext(ExtensionHostContext)
    if (extensionHost === undefined) {
        throw new Error("useExtensionHost used outside of <ExtensionHostContext.Provider>")
    }
    return extensionHost
}
