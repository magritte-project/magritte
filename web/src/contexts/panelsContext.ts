import { createContext } from "react"

export interface RevealPanelOptions {
    readonly id: string
}

export interface PanelsContextType {
    readonly revealPanel: (options: RevealPanelOptions) => void
}

export const PanelsContext = createContext<PanelsContextType | undefined>(undefined)
