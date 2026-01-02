import {
    IngestSongsContext,
    type IngestSongsContextType,
} from "@/contexts/ingestSongsContext"
import { useContext } from "react"

export type UseIngestSongsResult = IngestSongsContextType

export default function useIngestSongs(): UseIngestSongsResult {
    const player = useContext(IngestSongsContext)
    if (player === undefined) {
        throw new Error(
            "useIngestSongs() used outside of <IngestSongsContextProvider>",
        )
    }
    return player
}
