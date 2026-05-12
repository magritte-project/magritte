import { createContext } from "react"

export interface AppCommandPaletteContextType {
    readonly isOpen: boolean
    readonly setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
    readonly modifierKey: "ctrl" | "meta"
}

export const AppCommandPaletteContext = createContext<AppCommandPaletteContextType | undefined>(
    undefined,
)
