import type { Command } from "@/commands/command"
import { type ReactNode, useReducer } from "react"
import {
    CommandPaletteContext,
    type CommandPaletteMessage,
} from "../commandPaletteContext"

function handleMessage(
    commands: Command[],
    message: CommandPaletteMessage,
): Command[] {
    switch (message.type) {
        case "mount": {
            return [...commands, ...message.commands]
        }
        case "unmount": {
            const toRemove = new Set(
                message.commands.map((command) => command.identifier),
            )
            return commands.filter(
                (command) => !toRemove.has(command.identifier),
            )
        }
    }
}

export interface CommandPaletteContextProviderProps {
    readonly children?: ReactNode
}

export default function CommandPaletteContextProvider({
    children,
}: CommandPaletteContextProviderProps) {
    const [commands, dispatch] = useReducer(handleMessage, [])
    return (
        <CommandPaletteContext.Provider value={{ commands, dispatch }}>
            {children}
        </CommandPaletteContext.Provider>
    )
}
