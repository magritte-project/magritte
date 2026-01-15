import { createContext } from "react"

import type { IngestSong } from "@/api/openapi"

export interface IngestSongsContextType {
    readonly isAdded: (song: IngestSong) => boolean
    readonly add: (newSong: IngestSong) => void
    readonly remove: (oldSong: IngestSong) => void
    readonly flush: () => Promise<void>
}

export const IngestSongsContext = createContext<IngestSongsContextType | undefined>(undefined)
