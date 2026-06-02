import { defineBroadcast, protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

import { CommandInput, CommandInputQuery } from "./inputs"

export const CommandCoordinatorProtocol = protocol("Magritte.Host.CommandCoordinator", {
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
