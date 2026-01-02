import type { JsonStructure } from "react-cmdk"

import { createContext } from "react"

export type AppCommandPaletteContextMessage =
    | { type: "mount"; items: JsonStructure }
    | { type: "unmount"; items: JsonStructure }

export interface AppCommandPaletteContextType {
    readonly isOpen: boolean
    readonly setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
    readonly items: JsonStructure
    readonly dispatch: (message: AppCommandPaletteContextMessage) => void
}

export const AppCommandPaletteContext = createContext<AppCommandPaletteContextType | undefined>(
    undefined,
)
