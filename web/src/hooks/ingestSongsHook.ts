import { useContext } from "react"

import { IngestSongsContext, type IngestSongsContextType } from "@/contexts/ingestSongsContext"

export type UseIngestSongsResult = IngestSongsContextType

export default function useIngestSongs(): UseIngestSongsResult {
    const player = useContext(IngestSongsContext)
    if (player === undefined) {
        throw new Error("useIngestSongs() used outside of <IngestSongsContextProvider>")
    }
    return player
}
