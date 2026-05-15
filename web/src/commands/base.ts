import type { CommandPresentation } from "@magritte/sdk/extension"

import type { CommandInputs } from "@/commands/inputs/base"

export interface Command {
    /** Unique identifier for the command */
    readonly id: string

    /** The search terms for the command */
    readonly searchTerms: string

    /** Present the command to the user with the given inputs */
    readonly present: (inputs: CommandInputs) => Promise<CommandPresentation>

    /** Executes the command with the given inputs */
    readonly execute: (inputs: CommandInputs) => Promise<unknown>
}
