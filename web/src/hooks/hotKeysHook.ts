import { useContext } from "react"

import { HotKeysContext, type HotKeysContextType } from "@/contexts/hotKeysContext"

export type HotKeysResult = HotKeysContextType

export default function useHotKeys(): HotKeysResult {
    const context = useContext(HotKeysContext)
    if (context === undefined) {
        throw new Error("useHotKeys() used outside of <HotKeysContextProvider>")
    }
    return context
}
