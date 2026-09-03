import { createContext } from "react"

export interface HotKeyDefinition {
    /** The key to register for the hot key. */
    readonly key: string

    /** Whether the hot key requires the modifier key (Ctrl or Meta) to be pressed. */
    readonly requiresModifier?: boolean
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
