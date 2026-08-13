import { createContext } from "react"

export interface HotKeyDefinition {
    readonly key: string
}
export type UnregisterHotKey = () => void

export interface HotKeysContextType {
    readonly registerHotKey: (
        definition: HotKeyDefinition,
        handler: () => boolean,
    ) => UnregisterHotKey
    readonly modifierKey: "ctrl" | "meta"
}

export const HotKeysContext = createContext<HotKeysContextType | undefined>(undefined)
