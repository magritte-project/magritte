import type { CommandIcon } from "@magritte/sdk"

import type { CommandInputs } from "@/commands/inputs/base"

export type SearchResultAction = "reveal" | "play" | "add"

export interface SearchSourceResult {
    readonly id: string
    readonly icon?: CommandIcon
    readonly title: string
    readonly subtitle?: string
    readonly add?: () => Promise<void>
    readonly play?: () => Promise<void>
    readonly reveal?: () => Promise<void>
}

export interface SearchSource {
    /** The unique identifier for this search source */
    readonly id: string

    /** The kinds of the inputs this source requires for searching */
    readonly requiredInputKinds: readonly string[]

    search(query: string, inputs: CommandInputs): Promise<SearchSourceResult[]>
}
