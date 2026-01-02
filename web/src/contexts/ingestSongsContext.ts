import type { IngestSong } from "@/api/openapi"
import { createContext } from "react"

export interface IngestSongsContextType {
    readonly isAdded: (song: IngestSong) => boolean
    readonly add: (newSongs: readonly IngestSong[]) => void
    readonly flush: () => Promise<void>
}

export const IngestSongsContext = createContext<
    IngestSongsContextType | undefined
>(undefined)
