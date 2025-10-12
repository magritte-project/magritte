export interface Command {
    readonly identifier: string
    readonly displayName: string
    readonly action?: () => Promise<void>
    readonly subcommands?: readonly Command[]
}
