import {
    allCommandInputsOf,
    LibraryInputSchema,
    type ExtensionHost,
    type Library,
    type Player,
    type SearchCommandResponder,
    type SearchCommandResponderEffectContext,
    type SearchCommandResponderSearchContext,
    type SearchCommandResponderSection,
} from "@magritte/sdk"

import {
    songResourceToExtensionTag,
    songResourceToIngestSong,
    songResourceToPlayableItem,
} from "@/conversions/songs"
import type { MusicResponse } from "@/musickit/models/base"
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

function parseSongID(id: string): string {
    const songComponent = id.split(":").find((component) => component.startsWith("song_"))
    if (!songComponent) {
        throw new Error(`Malformed search result ID ${id}`)
    }
    return songComponent.slice("song_".length)
}

export default class AppleMusicSearchResponder implements SearchCommandResponder {
    private _library: Library | null
    private _player: Player | null

    constructor(private readonly musicKit: MusicKit.Instance) {
        this._library = null
        this._player = null
    }

    async awaken(host: ExtensionHost) {
        this._library = await host.library()
        this._player = await host.player()
    }

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
                    supportedEffects: ["play", "addToLibrary"],
                })),
            },
        ]
    }

    private async getSong(id: string): Promise<SongResource> {
        const songID = parseSongID(id)
        const { data: response } = await this.musicKit.api.music<MusicResponse<SongResource>>(
            `/v1/catalog/{{storefrontId}}/songs/${encodeURIComponent(songID)}`,
        )
        const song = response.data[0]
        if (!song) {
            throw new Error(`Could not find song ${songID}`)
        }
        return song
    }

    async executeReveal(_: SearchCommandResponderEffectContext): Promise<void> {}

    async executePlay({ id }: SearchCommandResponderEffectContext): Promise<void> {
        if (!this._player) {
            throw new Error("Player not available")
        }
        const song = await this.getSong(id)
        const item = songResourceToPlayableItem(song)
        await this._player.replaceQueue({
            newQueueItems: [item],
            startingItem: item,
            playNow: true,
        })
    }

    async executeAddToLibrary({ id, inputs }: SearchCommandResponderEffectContext): Promise<void> {
        if (!this._library) {
            throw new Error("Library not available")
        }

        const song = await this.getSong(id)

        const [libraryInput] = allCommandInputsOf(inputs, LibraryInputSchema)
        if (!libraryInput) {
            throw new Error("No library selected")
        }

        const extensionTag = songResourceToExtensionTag(song)
        const { items } = await this._library.readExtensionSources({
            libraryId: libraryInput.id,
            extensionTags: [extensionTag],
            limit: 1,
        })
        // Skip songs already in the library, so adding again never creates duplicates
        if (items.some((item) => item.extension_tag === extensionTag)) {
            return
        }

        await this._library.bulkIngestSongs({
            libraryId: libraryInput.id,
            songs: [songResourceToIngestSong(song)],
        })
    }
}
