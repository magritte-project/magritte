import { createContext } from "react"

import type { IngestSong } from "@/api/openapi"

export interface IngestSongsContextType {
    readonly isAdded: (song: IngestSong) => boolean
    readonly add: (newSongs: readonly IngestSong[]) => void
    readonly flush: () => Promise<void>
}

export const IngestSongsContext = createContext<IngestSongsContextType | undefined>(undefined)
