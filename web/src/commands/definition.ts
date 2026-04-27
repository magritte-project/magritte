import type { CommandInputs } from "@/commands/inputs/base"

export interface CommandDefinition {
    /** Unique identifier for the command */
    readonly id: string

    /** The search terms for the command */
    readonly searchTerms: string

    /** The current display name for the command */
    readonly displayName: (inputs: CommandInputs) => string

    /** Whether the command is currently disabled */
    readonly disabled?: (inputs: CommandInputs) => boolean

    /** Executes the command with the given inputs */
    readonly execute: (inputs: CommandInputs) => Promise<unknown>
}
