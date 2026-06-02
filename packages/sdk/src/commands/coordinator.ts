import { defineBroadcast, protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

import { CommandInput, CommandInputQuery } from "./inputs"

export const CommandQuery = z4.object({
    /** The query string to match against command inputs */
    query: z4.string().optional().readonly(),
})
export type CommandQuery = z4.infer<typeof CommandQuery>

export const CommandQueryResult = z4.object({
    /** The unique identifier for the command */
    id: z4.string().readonly(),

    /** The current human-readable name of the command */
    displayName: z4.string().readonly(),
})
export type CommandQueryResult = z4.infer<typeof CommandQueryResult>

export const CommandRunRequest = z4.object({
    /** The unique identifier for the command to run */
    id: z4.string().readonly(),
})
export type CommandRunRequest = z4.infer<typeof CommandRunRequest>

export const CommandCoordinatorProtocol = protocol("Magritte.Host.CommandCoordinator", {
    /** Query for runnable commands that match the given query string */
    queryRunnable: {
        input: CommandQuery,
        output: z4.array(CommandQueryResult),
    },

    /** Run the command matching the given unique identifier */
    runCommand: {
        input: CommandRunRequest,
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
    allMatching: {
        input: CommandInputQuery,
        output: z4.array(CommandInput),
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
