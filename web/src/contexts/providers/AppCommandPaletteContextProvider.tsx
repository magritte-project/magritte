import { type ReactNode, useMemo, useState } from "react"

import { AppCommandPaletteContext } from "@/contexts/appCommandPaletteContext"

export interface AppCommandPaletteContextProviderProps {
    readonly children?: ReactNode
}

export default function AppCommandPaletteContextProvider({
    children,
}: AppCommandPaletteContextProviderProps) {
    const [isOpen, setIsOpen] = useState(false)
    const modifierKey = useMemo(() => {
        if (navigator.platform.startsWith("Mac") || navigator.platform === "iPhone") {
            return "meta" as const
        } else {
            return "ctrl" as const
        }
    }, [])
    return (
        <AppCommandPaletteContext.Provider value={{ isOpen, setIsOpen, modifierKey }}>
            {children}
        </AppCommandPaletteContext.Provider>
    )
}
