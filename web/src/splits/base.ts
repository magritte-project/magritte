import type { Icon } from "@phosphor-icons/react"
import type { FunctionComponent } from "react"

export type SplitLocation = "start" | "end"
export type SplitInsertOrder = "first" | "last"

export type SplitID = string

export interface SplitDefinition {
    /** Unique identifier for the split */
    readonly id: SplitID

    /** The name of the split */
    readonly name: string

    /** The icon of the split */
    readonly icon: Icon

    /** The minimum width of the split */
    readonly minWidth: React.CSSProperties["minWidth"]

    /** Where the split prefers to be placed in the UI */
    readonly preferredLocation: SplitLocation

    /** Whether the split allows multiple instances */
    readonly allowsMultiple: boolean

    /** The component which renders the split */
    readonly component: FunctionComponent
}
