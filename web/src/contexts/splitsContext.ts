import { createContext } from "react"

import type { SplitInsertOrder, SplitLocation } from "@/splits/base"

export interface OpenSplitOptions {
    /** The ID of the split to open */
    readonly id: string

    /** Where to place the split in the UI */
    readonly preferredLocation?: SplitLocation

    /** Where to insert the new split relative to other splits */
    readonly insertOrder?: SplitInsertOrder
}

export type CloseSplitOptions = {
    readonly by: "index"
    readonly location: SplitLocation
    readonly index: number
}

export interface SplitsContextType {
    /** Request that a split be opened */
    readonly openSplit: (options: OpenSplitOptions) => boolean

    /** Request that a split be closed */
    readonly closeSplit: (options: CloseSplitOptions) => void
}

export const SplitsContext = createContext<SplitsContextType | undefined>(undefined)
