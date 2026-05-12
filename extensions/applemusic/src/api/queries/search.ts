import { queryOptions } from "@tanstack/react-query"

import { search } from "@/api/keys/search"
import type { MusicSearchResponse } from "@/musickit/models/search"

export function searchSongs(
    musicKit: MusicKit.Instance,
    term: string,
    offset: number = 0,
    limit: number = 20,
) {
    return queryOptions({
        queryKey: search(term, "songs"),
        queryFn: async () => {
            if (!term) {
                return []
            }
            const { data: response } = await musicKit.api.music<MusicSearchResponse>(
                "/v1/catalog/{{storefrontId}}/search",
                {
                    term,
                    types: "songs",
                    offset: String(offset),
                    limit: String(limit),
                },
            )
            return response.results?.songs?.data ?? []
        },
    })
}
