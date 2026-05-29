import { type ReactNode } from "react"

import { PanelsContext, type PanelsContextType } from "@/contexts/panelsContext"

export interface PanelsContextProviderProps {
    readonly value: PanelsContextType
    readonly children?: ReactNode
}

export default function PanelsContextProvider({ value, children }: PanelsContextProviderProps) {
    return <PanelsContext.Provider value={value}>{children}</PanelsContext.Provider>
}
