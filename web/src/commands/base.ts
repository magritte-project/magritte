import type { CommandPresentation } from "@magritte/sdk"

import type { CommandInputs } from "@/commands/inputs/base"

/** A view the command palette can present in place of the command list */
export type CommandView = {
    /** Search the catalog of a streaming music extension */
    readonly type: "catalogSearch"
    readonly extensionId: string
}

export interface Command {
    /** Unique identifier for the command */
    readonly id: string

    /** The search terms for the command */
    readonly searchTerms: string

    /** The kinds of the inputs this command requires to execute */
    readonly requiredInputKinds: readonly string[]

    /** When set, selecting the command in the palette presents this view instead of executing */
    readonly view?: CommandView

    /** Present the command to the user with the given inputs */
    readonly present: (inputs: CommandInputs) => Promise<CommandPresentation>

    /** Executes the command with the given inputs */
    readonly execute: (inputs: CommandInputs) => Promise<unknown>
}
