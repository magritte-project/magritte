import { queryOptions } from "@tanstack/react-query"

import { search } from "@/api/keys/search"
import type { AlbumResource } from "@/musickit/models/album"
import type { ArtistResource } from "@/musickit/models/artist"
import type { MusicSearchResponse } from "@/musickit/models/search"
import type { SongResource } from "@/musickit/models/song"

export interface CatalogSearchResults {
    readonly artists: readonly ArtistResource[]
    readonly albums: readonly AlbumResource[]
    readonly songs: readonly SongResource[]
}

const searchTypes = "artists,albums,songs"

export function searchCatalog(musicKit: MusicKit.Instance, term: string, limit: number = 10) {
    return queryOptions({
        queryKey: search(term, searchTypes, limit),
        queryFn: async (): Promise<CatalogSearchResults> => {
            if (!term) {
                return { artists: [], albums: [], songs: [] }
            }
            const { data: response } = await musicKit.api.music<MusicSearchResponse>(
                "/v1/catalog/{{storefrontId}}/search",
                {
                    term,
                    types: searchTypes,
                    limit: String(limit),
                },
            )
            return {
                artists: response.results?.artists?.data ?? [],
                albums: response.results?.albums?.data ?? [],
                songs: response.results?.songs?.data ?? [],
            }
        },
    })
}
