import { protocol } from "@magritte/rpc"
import z4 from "zod/v4"

export const CommandSelector = z4.object({
    /** Unique identifier for the command */
    id: z4.string().readonly(),
})
export type CommandSelector = z4.infer<typeof CommandSelector>

export const CommandPresentation = z4.object({
    /** Current display name for the command */
    displayName: z4.string().readonly(),

    /** Whether the command is currently disabled */
    disabled: z4.boolean().readonly(),
})
export type CommandPresentation = z4.infer<typeof CommandPresentation>

export const CommandResponderProtocol = protocol("Magritte.Extension.CommandResponder", {
    /** Get the presentation properties of a command */
    presentCommand: {
        input: CommandSelector,
        output: CommandPresentation,
    },

    /** Execute a command */
    executeCommand: {
        input: CommandSelector,
        output: z4.void(),
    },
})
