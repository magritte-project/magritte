import type { ReactNode } from "react"

import { DismissContext, type Dismiss } from "@/contexts/dismissContext"

export interface DismissContextProviderProps {
    readonly value: Dismiss
    readonly children?: ReactNode
}

export default function DismissContextProvider({ value, children }: DismissContextProviderProps) {
    return <DismissContext.Provider value={value}>{children}</DismissContext.Provider>
}
