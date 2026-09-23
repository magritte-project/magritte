import type {
    CommandIcon,
    CommandPresentation as ExtensionCommandPresentation,
} from "@magritte/sdk"
import type { Icon } from "@phosphor-icons/react"

import type { CommandInputs } from "@/commands/inputs/base"

interface CommandPresentation extends Omit<ExtensionCommandPresentation, "icon"> {
    /** Optional icon for the command */
    readonly icon?: Icon | ExtensionCommandPresentation["icon"]
}

export interface Command {
    /** Unique identifier for the command */
    readonly id: string

    /** The search terms for the command */
    readonly searchTerms: string

    /** The kinds of the inputs this command requires to execute */
    readonly requiredInputKinds: readonly string[]

    /** Whether the command should be highlighted when it becomes available */
    readonly highlightAvailability: boolean

    /** Present the command to the user with the given inputs */
    readonly present: (inputs: CommandInputs) => Promise<CommandPresentation>

    /** Executes the command with the given inputs */
    readonly execute: (inputs: CommandInputs) => Promise<unknown>
}

export interface SearchCommand {
    /** Unique identifier for the search command */
    readonly id: string

    /** The kinds of the inputs this source requires for searching */
    readonly requiredInputKinds: readonly string[]

    /** Search for items matching the given query and inputs */
    readonly search: (query: string, inputs: CommandInputs) => Promise<SearchCommandSection[]>
}

export interface SearchCommandSection {
    /** Human readalbe name for this section */
    readonly displayName: string

    /** The items in this section */
    readonly items: readonly SearchCommandItem[]
}

export interface SearchCommandItem {
    /** Unique identifier for this item */
    readonly id: string

    /** Icon for this item, if any */
    readonly icon?: CommandIcon | Icon

    /** Title of this item */
    readonly title: string

    /** Subtitle of this item, if any */
    readonly subtitle?: string

    /** Action to add this item to the library, if any */
    readonly addToLibrary?: () => Promise<void>

    /** Action to play this item, if any */
    readonly play?: () => Promise<void>

    /** Action to reveal this item, if any */
    readonly reveal?: () => Promise<void>
}
