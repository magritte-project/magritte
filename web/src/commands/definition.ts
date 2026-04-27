import type { CommandInputs } from "@/commands/inputs/base"

export interface CommandDefinition {
    /** Unique identifier for the command */
    readonly id: string

    /** The search terms for the command */
    readonly searchTerms: string

    readonly displayName: (inputs: CommandInputs) => string

    readonly disabled?: (inputs: CommandInputs) => boolean

    /** Executes the command with the given inputs */
    readonly execute: (inputs: CommandInputs) => Promise<unknown>
}
