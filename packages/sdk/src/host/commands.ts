import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

export type CommandInputArg =
    | string
    | number
    | boolean
    | null
    | readonly CommandInputArg[]
    | { readonly [x in string]?: CommandInputArg }
export const CommandInputArg: z4.ZodType<CommandInputArg> = z4.lazy(() =>
    z4.union([
        z4.string(),
        z4.number(),
        z4.boolean(),
        z4.null(),
        z4.array(CommandInputArg).readonly(),
        z4.record(z4.string(), CommandInputArg.optional()).readonly(),
    ]),
)

export const CommandInput = z4.object({
    kind: z4.string(),
    id: z4.union([z4.string(), z4.number()]),
    args: z4.record(z4.string(), CommandInputArg).optional(),
})
export type CommandInput = z4.infer<typeof CommandInput>

export const SingletonCommandInput = CommandInput.extend({
    id: z4.literal("__onlyOne__"),
})
export type SingletonCommandInput = z4.infer<typeof SingletonCommandInput>

export const CommandInputQuery = z4.object({
    kind: z4.string(),
})
export type CommandInputQuery = z4.infer<typeof CommandInputQuery>

export const CommandsProtocol = protocol("Magritte.Host.Commands", {
    /** Add an input to the command system */
    addInput: {
        input: CommandInput,
        output: z4.void(),
    },
    /** Remove an input from the command system */
    removeInput: {
        input: z4.string(),
        output: z4.void(),
    },
    /** Check if any inputs match the given query */
    hasAnyInput: {
        input: CommandInputQuery,
        output: z4.boolean(),
    },
    /** Get all inputs that match the given query */
    allOfInputs: {
        input: CommandInputQuery,
        output: z4.array(CommandInput),
    },
    /** Get the one and only input that matches the given query */
    onlyInput: {
        input: CommandInputQuery,
        output: z4.array(CommandInput),
    },
})
export type CommandInputs = ProtocolObject<typeof CommandsProtocol>
