import type { OnScreenEntityKind, OnScreenEntityOfKind } from "@/commands/onScreen"

export interface CommandInputs {
    getOnScreenEntities<TKind extends OnScreenEntityKind>(
        kind: TKind,
    ): readonly OnScreenEntityOfKind<TKind>[]
}

export interface CommandDefinition {
    /** Unique identifier for the command */
    readonly id: string

    /** A friendly name for the command */
    readonly displayName: string

    /** A brief description of what the command does */
    readonly description?: string

    /** A list of entity types that the command requires, if any */
    readonly requires: readonly OnScreenEntityKind[]

    /** Executes the command with the given inputs */
    readonly execute: (inputs: CommandInputs) => Promise<unknown>
}
