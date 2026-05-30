import { useMemo, type ReactNode } from "react"

import { panelCommands } from "@/commands/suites/panels"
import { PanelsContext, type PanelsContextType } from "@/contexts/panelsContext"

import CommandsProvider from "./CommandsProvider"

export interface PanelsContextProviderProps {
    readonly value: PanelsContextType
    readonly children?: ReactNode
}

export default function PanelsContextProvider({ value, children }: PanelsContextProviderProps) {
    const commands = useMemo(() => {
        return panelCommands(value.panels, value.revealPanel)
    }, [value.panels, value.revealPanel])
    return (
        <PanelsContext.Provider value={value}>
            <CommandsProvider commands={commands}>{children}</CommandsProvider>
        </PanelsContext.Provider>
    )
}
