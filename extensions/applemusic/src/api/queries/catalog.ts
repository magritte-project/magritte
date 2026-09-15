import { queryOptions } from "@tanstack/react-query"

import { catalog } from "@/api/keys/catalog"
import type { AlbumResource } from "@/musickit/models/album"
import type { ArtistResource } from "@/musickit/models/artist"
import { appleMusicBaseUrl, type MusicResponse } from "@/musickit/models/base"
import type { CollectionKind, CollectionResource } from "@/musickit/models/collection"
import type { SongResource } from "@/musickit/models/song"
import { fetchAllPages } from "@/musickit/pagination"
import { BatchLoader } from "@/utilities/batchLoader"

function getCollectionsPath(kind: CollectionKind): string {
    switch (kind) {
        case "albums":
            return "/v1/catalog/{{storefrontId}}/albums"
        case "playlists":
            return "/v1/catalog/{{storefrontId}}/playlists"
        case "library-albums":
            return "/v1/me/library/albums"
        case "library-playlists":
            return "/v1/me/library/playlists"
    }
}

function getCollectionPath(kind: CollectionKind, id: string): string {
    return `${getCollectionsPath(kind)}/${encodeURIComponent(id)}`
}

// Playlists may also contain music videos, which we cannot ingest
function isSongTrack(track: SongResource): boolean {
    return track.type === "songs" || track.type === "library-songs"
}

export interface Collection {
    readonly resource: CollectionResource
    readonly tracks: readonly SongResource[]
}

export function readCollection(musicKit: MusicKit.Instance, kind: CollectionKind, id: string) {
    return queryOptions({
        queryKey: catalog(kind, id),
        queryFn: async (): Promise<Collection> => {
            const path = getCollectionPath(kind, id)
            const [{ data: response }, tracks] = await Promise.all([
                musicKit.api.music<MusicResponse<CollectionResource>>(path),
                fetchAllPages<SongResource>(musicKit, `${path}/tracks`, {
                    queryParameters: { limit: "100" },
                }),
            ])
            const resource = response.data[0]
            if (resource === undefined) {
                throw new Error(`Could not find ${kind} ${id}`)
            }
            return { resource, tracks: tracks.filter(isSongTrack) }
        },
    })
}

/** The maximum number of IDs accepted when fetching multiple collections */
const collectionsBatchSize = 100

const collectionTracksLoaders = new WeakMap<
    MusicKit.Instance,
    Map<CollectionKind, BatchLoader<string, readonly SongResource[]>>
>()

function getCollectionTracksLoader(musicKit: MusicKit.Instance, kind: CollectionKind) {
    let loaders = collectionTracksLoaders.get(musicKit)
    if (loaders === undefined) {
        loaders = new Map()
        collectionTracksLoaders.set(musicKit, loaders)
    }
    let loader = loaders.get(kind)
    if (loader === undefined) {
        loader = new BatchLoader<string, readonly SongResource[]>(async (ids) => {
            const { data: response } = await musicKit.api.music<MusicResponse<CollectionResource>>(
                getCollectionsPath(kind),
                { ids: ids.join(","), include: "tracks" },
            )
            const entries = await Promise.all(
                response.data.map(async (resource) => {
                    const relationship = resource.relationships?.tracks
                    let tracks = relationship?.data ?? []
                    if (relationship?.next) {
                        const nextUrl = new URL(relationship.next, appleMusicBaseUrl)
                        const remainingTracks = await fetchAllPages<SongResource>(
                            musicKit,
                            nextUrl.pathname,
                            { queryParameters: Object.fromEntries(nextUrl.searchParams) },
                        )
                        tracks = [...tracks, ...remainingTracks]
                    }
                    return [resource.id, tracks.filter(isSongTrack)] as const
                }),
            )
            return new Map(entries)
        }, collectionsBatchSize)
        loaders.set(kind, loader)
    }
    return loader
}

/** Read only the tracks of a collection, batched with other collections read at the same time */
export function readCollectionTracks(
    musicKit: MusicKit.Instance,
    kind: CollectionKind,
    id: string,
) {
    return queryOptions({
        queryKey: catalog(kind, id, "tracks"),
        queryFn: () => getCollectionTracksLoader(musicKit, kind).load(id),
    })
}

export interface ArtistDiscography {
    readonly artist: ArtistResource
    readonly albums: readonly AlbumResource[]
    readonly singlesAndEPs: readonly AlbumResource[]
}

function isSingleOrEP(album: AlbumResource): boolean {
    return !!album.attributes?.isSingle || / - (Single|EP)$/.test(album.attributes?.name ?? "")
}

export function readArtist(musicKit: MusicKit.Instance, id: string) {
    return queryOptions({
        queryKey: catalog("artists", id),
        queryFn: async (): Promise<ArtistDiscography> => {
            const path = `/v1/catalog/{{storefrontId}}/artists/${encodeURIComponent(id)}`
            const [{ data: response }, albums] = await Promise.all([
                musicKit.api.music<MusicResponse<ArtistResource>>(path),
                fetchAllPages<AlbumResource>(musicKit, `${path}/albums`, {
                    queryParameters: { limit: "100" },
                    maxItems: 500,
                }),
            ])
            const artist = response.data[0]
            if (artist === undefined) {
                throw new Error(`Could not find artist ${id}`)
            }
            const newestFirst = [...albums].sort((a, b) =>
                (b.attributes?.releaseDate ?? "").localeCompare(a.attributes?.releaseDate ?? ""),
            )
            return {
                artist,
                albums: newestFirst.filter((album) => !isSingleOrEP(album)),
                singlesAndEPs: newestFirst.filter(isSingleOrEP),
            }
        },
    })
}
