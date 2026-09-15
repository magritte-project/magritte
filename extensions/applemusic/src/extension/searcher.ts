import type { CatalogSearcher, CatalogSearchQuery, CatalogSearchResults } from "@magritte/sdk"

import { songResourceToIngestSong } from "@/conversions/songs"
import type { MusicSearchResponse } from "@/musickit/models/search"

export default class AppleMusicCatalogSearcher implements CatalogSearcher {
    constructor(private readonly musicKit: MusicKit.Instance) {}

    async searchCatalog({ term, limit = 15 }: CatalogSearchQuery): Promise<CatalogSearchResults> {
        if (!term) {
            return { songs: [] }
        }
        const { data: response } = await this.musicKit.api.music<MusicSearchResponse>(
            "/v1/catalog/{{storefrontId}}/search",
            {
                term,
                types: "songs",
                limit: String(limit),
            },
        )
        const songs = response.results?.songs?.data ?? []
        return {
            songs: songs.map((song) => ({
                id: song.id,
                song: songResourceToIngestSong(song),
            })),
        }
    }
}
