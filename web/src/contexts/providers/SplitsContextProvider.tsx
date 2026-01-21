import { type ReactNode } from "react"

import { SplitsContext, type SplitsContextType } from "@/contexts/splitsContext"

export interface SplitsContextProviderProps {
    readonly value: SplitsContextType
    readonly children?: ReactNode
}

export default function SplitsContextProvider({ value, children }: SplitsContextProviderProps) {
    return <SplitsContext.Provider value={value}>{children}</SplitsContext.Provider>
}
