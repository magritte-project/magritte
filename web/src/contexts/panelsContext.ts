import { createContext } from "react"

import type { PanelDefinition } from "@/utilities/panelRegistry"

export interface RevealPanelOptions {
    readonly id: string
}

export interface PanelsContextType {
    readonly panels: readonly PanelDefinition[]
    readonly revealPanel: (options: RevealPanelOptions) => void
    readonly hidePanels: () => void
}

export const PanelsContext = createContext<PanelsContextType | undefined>(undefined)
