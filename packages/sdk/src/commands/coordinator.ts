import { defineBroadcast, protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

import { CommandInputSchema, CommandInputQuerySchema } from "./inputs"

export const CommandQuerySchema = z4.object({
    /** The query string to match against command inputs */
    query: z4.string().optional().readonly(),
})
export type CommandQuery = z4.infer<typeof CommandQuerySchema>

export const CommandQueryResultSchema = z4.object({
    /** The unique identifier for the command */
    id: z4.string().readonly(),

    /** The current human-readable name of the command */
    displayName: z4.string().readonly(),
})
export type CommandQueryResult = z4.infer<typeof CommandQueryResultSchema>

export const CommandRunRequestSchema = z4.object({
    /** The unique identifier for the command to run */
    id: z4.string().readonly(),
})
export type CommandRunRequest = z4.infer<typeof CommandRunRequestSchema>

export const CommandCoordinatorProtocol = protocol("Magritte.Host.CommandCoordinator", {
    /** Query for runnable commands that match the given query string */
    queryRunnable: {
        input: CommandQuerySchema,
        output: z4.array(CommandQueryResultSchema),
    },

    /** Run the command matching the given unique identifier */
    runCommand: {
        input: CommandRunRequestSchema,
        output: z4.void(),
    },

    /** Add an input to the command system */
    addInput: {
        input: CommandInputSchema,
        output: z4.void(),
    },

    /** Remove an input from the command system */
    removeInput: {
        input: CommandInputSchema,
        output: z4.void(),
    },

    /** Get all inputs that match the given query */
    allMatching: {
        input: CommandInputQuerySchema,
        output: z4.array(CommandInputSchema),
    },
})
export type CommandCoordinator = ProtocolObject<typeof CommandCoordinatorProtocol>

/**
 * Broadcast signaling that the available command inputs have changed.
 */
export const CommandInputsDidChange = defineBroadcast(
    CommandCoordinatorProtocol.name,
    "commandInputsDidChange",
    z4.void(),
)
