import { createContext } from "react"

export interface AppPaletteContextType {
    readonly isOpen: boolean
    readonly setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export const AppPaletteContext = createContext<AppPaletteContextType | undefined>(undefined)
