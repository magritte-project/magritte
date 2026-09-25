import { createContext } from "react"

import type { LastfmClient } from "@/lastfm/client"
import type { MusicBrainzClient } from "@/musicbrainz/client"
import type { WikipediaClient } from "@/wikipedia/client"

export interface Clients {
    readonly musicbrainz: MusicBrainzClient
    readonly wikipedia: WikipediaClient
    readonly lastfm: LastfmClient
}

export const ClientsContext = createContext<Clients | undefined>(undefined)
