import { queryOptions } from "@tanstack/react-query"

import { getLyrics } from "@/actions/getLyrics.server"
import { lyrics } from "@/api/keys/lyrics"

export function readLyrics(artist: string, title: string) {
    return queryOptions({
        queryKey: lyrics(artist, title),
        queryFn: async () => await getLyrics({ artist, title }),
        // Lyrics don't change, and a missing song won't appear by asking again
        staleTime: Infinity,
        retry: false,
    })
}
