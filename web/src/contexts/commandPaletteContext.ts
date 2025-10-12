import type { Command } from "@/commands/command"
import { createContext } from "react"

export type CommandPaletteMessage =
    | { type: "mount"; commands: readonly Command[] }
    | { type: "unmount"; commands: readonly Command[] }

export interface CommandPaletteContextType {
    readonly commands: Command[]
    readonly dispatch: (message: CommandPaletteMessage) => void
}

export const CommandPaletteContext = createContext<
    CommandPaletteContextType | undefined
>(undefined)
