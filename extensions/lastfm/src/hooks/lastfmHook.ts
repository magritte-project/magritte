import { useContext } from "react"

import { LastfmContext, type Lastfm } from "@/contexts/lastfmContext"

export default function useLastfm(): Lastfm {
    const lastfm = useContext(LastfmContext)
    if (lastfm === undefined) {
        throw new Error("useLastfm used outside of <LastfmContext.Provider>")
    }
    return lastfm
}
