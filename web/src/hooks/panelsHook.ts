import { useContext } from "react"

import { type PanelsContextType, PanelsContext } from "@/contexts/panelsContext"

export type UsePanelsResult = PanelsContextType

export default function usePanels(): UsePanelsResult {
    const Panels = useContext(PanelsContext)
    if (Panels === undefined) {
        throw new Error("usePanels() used outside of <PanelsContextProvider>")
    }
    return Panels
}
