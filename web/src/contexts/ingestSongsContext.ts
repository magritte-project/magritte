import type { IngestSong } from "@magritte/api"
import { createContext } from "react"

export interface IngestSongsContextType {
    readonly isAdded: (song: IngestSong) => boolean
    readonly add: (newSong: IngestSong) => void
    readonly remove: (oldSong: IngestSong) => void
    readonly flush: () => Promise<void>
}

export const IngestSongsContext = createContext<IngestSongsContextType | undefined>(undefined)
