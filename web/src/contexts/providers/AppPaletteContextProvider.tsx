import { type ReactNode, useState } from "react"

import { AppPaletteContext } from "@/contexts/appPaletteContext"

export interface AppPaletteContextProviderProps {
    readonly children?: ReactNode
}

export default function AppPaletteContextProvider({ children }: AppPaletteContextProviderProps) {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <AppPaletteContext.Provider value={{ isOpen, setIsOpen }}>
            {children}
        </AppPaletteContext.Provider>
    )
}
