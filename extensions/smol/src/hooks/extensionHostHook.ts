import { useContext } from "react"

import { ExtensionHostContext } from "@/contexts/extensionHostContext"

export default function useExtensionHost() {
    const context = useContext(ExtensionHostContext)
    if (context === undefined) {
        throw new Error("useExtensionHost must be used within an <ExtensionHostContext.Provider>")
    }
    return context
}
