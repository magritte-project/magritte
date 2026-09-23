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

export const CommandIconAppearanceSchema = z4.enum(["plain", "square", "circle"])
export type CommandIconAppearance = z4.infer<typeof CommandIconAppearanceSchema>

export const CommandIconSchema = z4.object({
    url: z4.string().readonly(),
    alt: z4.string().optional().readonly(),
    appearance: CommandIconAppearanceSchema.readonly(),
})
export type CommandIcon = z4.infer<typeof CommandIconSchema>

export const CommandPresentationSchema = z4.object({
    /** Optional icon for the command */
    icon: CommandIconSchema.optional().readonly(),

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
