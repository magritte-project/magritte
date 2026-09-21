import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

import { CommandInputSchema } from "./inputs"

export const CommandContextSchema = z4.object({
    /** ID of the command to present or execute */
    id: z4.string().readonly(),

    /** The required inputs for the command */
    inputs: z4.array(CommandInputSchema).readonly(),
})
export type CommandContext = z4.infer<typeof CommandContextSchema>

export const CommandPresentationSchema = z4.object({
    /** Current display name for the command */
    displayName: z4.string().readonly(),

    /** Whether the command is currently disabled */
    disabled: z4.boolean().readonly().optional(),
})
export type CommandPresentation = z4.infer<typeof CommandPresentationSchema>

export const CommandResponderProtocol = protocol("Magritte.Extension.CommandResponder", {
    /** Get the presentation properties of a command */
    presentCommand: {
        input: CommandContextSchema,
        output: CommandPresentationSchema,
    },

    /** Execute a command */
    executeCommand: {
        input: CommandContextSchema,
        output: z4.void(),
    },
})

export type CommandResponder = ProtocolObject<typeof CommandResponderProtocol>
