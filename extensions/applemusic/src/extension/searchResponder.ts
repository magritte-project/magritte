import type {
    SearchCommandResponder,
    SearchCommandResponderEffectContext,
    SearchCommandResponderSearchContext,
    SearchCommandResponderSection,
} from "@magritte/sdk"

import type { MusicSearchResponse } from "@/musickit/models/search"
import type { SongResource } from "@/musickit/models/song"
import { formatArtworkUrl } from "@/utilities/artwork"

function buildSongID(song: SongResource) {
    const components: string[] = []
    if (song.relationships?.artists.data.length) {
        components.push(`artist_${song.relationships.artists.data[0].id}`)
    }
    if (song.relationships?.albums.data.length) {
        components.push(`album_${song.relationships.albums.data[0].id}`)
    }
    components.push(`song_${song.id}`)
    return components.join(":")
}

export default class AppleMusicSearchResponder implements SearchCommandResponder {
    constructor(private readonly musicKit: MusicKit.Instance) {}

    async search({
        query,
    }: SearchCommandResponderSearchContext): Promise<SearchCommandResponderSection[]> {
        const { data: response } = await this.musicKit.api.music<MusicSearchResponse>(
            "/v1/catalog/{{storefrontId}}/search",
            {
                term: query,
                types: "songs",
                limit: String(5),
            },
        )
        const songs = response.results?.songs?.data ?? []
        return [
            {
                displayName: "Apple Music – Songs",
                items: songs.map((song) => ({
                    id: buildSongID(song),
                    icon: song.attributes?.artwork
                        ? {
                              url: formatArtworkUrl(song.attributes.artwork, 64),
                              alt: "Album Artwork",
                              appearance: "square",
                          }
                        : undefined,
                    title: song.attributes?.name ?? "--",
                    subtitle: `${song.attributes?.albumName ?? "--"} by ${song.attributes?.artistName ?? "--"}`,
                    supportedEffects: [],
                })),
            },
        ]
    }

    async executeReveal(_: SearchCommandResponderEffectContext): Promise<void> {}

    async executePlay(_: SearchCommandResponderEffectContext): Promise<void> {}

    async executeAddToLibrary(_: SearchCommandResponderEffectContext): Promise<void> {}
}
