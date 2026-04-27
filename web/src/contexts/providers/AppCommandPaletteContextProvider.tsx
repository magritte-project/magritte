import { type ReactNode, useState } from "react"

import { AppCommandPaletteContext } from "@/contexts/appCommandPaletteContext"

export interface AppCommandPaletteContextProviderProps {
    readonly children?: ReactNode
}

export default function AppCommandPaletteContextProvider({
    children,
}: AppCommandPaletteContextProviderProps) {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <AppCommandPaletteContext.Provider value={{ isOpen, setIsOpen }}>
            {children}
        </AppCommandPaletteContext.Provider>
    )
}
