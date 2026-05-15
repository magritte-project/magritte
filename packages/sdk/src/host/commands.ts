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
    /** A string describing the kind of the input */
    kind: z4.string().readonly(),

    /** A unique identifier for the input */
    id: z4.union([z4.string(), z4.number()]).readonly(),

    /** The arguments for the input */
    args: z4.record(z4.string(), CommandInputArg).optional().readonly(),
})
export type CommandInput = z4.infer<typeof CommandInput>

export const singletonCommandInputId = "__onlyOne__" as const
export const SingletonCommandInput = CommandInput.extend({
    id: z4.literal(singletonCommandInputId).readonly(),
})
export type SingletonCommandInput = z4.infer<typeof SingletonCommandInput>

export const CommandInputQuery = z4.object({
    /** The kind of input to query for */
    kind: z4.string().readonly(),
})
export type CommandInputQuery = z4.infer<typeof CommandInputQuery>

export const CommandDefinition = z4.object({
    /** Unique identifier for the command */
    id: z4.string().readonly(),

    /** The static search terms for the command */
    searchTerms: z4.string().readonly(),
})
export type CommandDefinition = z4.infer<typeof CommandDefinition>

export const CommandCoordinatorProtocol = protocol("Magritte.Host.CommandCoordinator", {
    /** Register a new command definition */
    registerCommand: {
        input: CommandDefinition,
        output: z4.void(),
    },

    /** Unregister a command definition */
    unregisterCommand: {
        input: CommandDefinition,
        output: z4.void(),
    },

    /** Add an input to the command system */
    addInput: {
        input: CommandInput,
        output: z4.void(),
    },

    /** Remove an input from the command system */
    removeInput: {
        input: CommandInput,
        output: z4.void(),
    },

    /** Get all inputs that match the given query */
    getInputsMatching: {
        input: CommandInputQuery,
        output: z4.array(CommandInput),
    },
})
export type CommandCoordinator = ProtocolObject<typeof CommandCoordinatorProtocol>
