import { createContext } from "react"

import type { LastfmAccount } from "@/lastfm/account"
import type { LastfmClient } from "@/lastfm/client"
import type { Scrobbler } from "@/lastfm/scrobbler"

export interface Lastfm {
    readonly client: LastfmClient
    readonly account: LastfmAccount
    readonly scrobbler: Scrobbler
}

export const LastfmContext = createContext<Lastfm | undefined>(undefined)
