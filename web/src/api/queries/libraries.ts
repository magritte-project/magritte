import type { API, ReadLibrarySongsSortBy } from "@magritte/api"
import { queryOptions } from "@tanstack/react-query"

import {
    libraries,
    library,
    libraryAlbum,
    libraryAlbums,
    libraryArtist,
    libraryArtists,
    libraryPermissions,
    librarySong,
    librarySongs,
} from "@/api/keys/libraries"

export function readLibraries(api: API) {
    return queryOptions({
        queryKey: libraries(),
        queryFn: () => api.client.readLibraries(),
    })
}

export function readLibrary(api: API, library_id: number) {
    return queryOptions({
        queryKey: library(library_id),
        queryFn: () => api.client.readLibrary(library_id),
    })
}

export function readLibraryHomeSubpaths(api: API, relative_to: string) {
    return queryOptions({
        queryKey: [...libraries(), "subpaths", relative_to],
        queryFn: () => api.client.readLibraryHomeSubpaths({ relative_to }),
    })
}

export function readLibraryPermissions(api: API, libraryId: number) {
    return queryOptions({
        queryKey: libraryPermissions(libraryId),
        queryFn: () => api.client.readLibraryPermissions(libraryId),
    })
}

export function readLibraryAlbum(api: API, libraryId: number, albumId: number) {
    return queryOptions({
        queryKey: libraryAlbum(libraryId, albumId),
        queryFn: () => api.client.readLibraryAlbum(libraryId, albumId),
    })
}

export interface ReadLibraryAlbumsCriteria {
    readonly libraryId: number
    readonly query?: string
    readonly artistId?: number
    readonly offset?: number
}

export function readLibraryAlbums(api: API, criteria: ReadLibraryAlbumsCriteria) {
    return queryOptions({
        queryKey: libraryAlbums(
            criteria.libraryId,
            criteria.query,
            criteria.artistId,
            criteria.offset,
        ),
        queryFn: () =>
            api.client.readLibraryAlbums(criteria.libraryId, {
                query: criteria.query,
                artist_id: criteria.artistId,
                offset: criteria.offset,
            }),
    })
}

export function readLibraryArtist(api: API, libraryId: number, artistId: number) {
    return queryOptions({
        queryKey: libraryArtist(libraryId, artistId),
        queryFn: () => api.client.readLibraryArtist(libraryId, artistId),
    })
}

export interface ReadLibraryArtistsCriteria {
    readonly libraryId: number
    readonly query?: string
    readonly offset?: number
}

export function readLibraryArtists(api: API, criteria: ReadLibraryArtistsCriteria) {
    return queryOptions({
        queryKey: libraryArtists(criteria.libraryId, criteria.query, criteria.offset),
        queryFn: () =>
            api.client.readLibraryArtists(criteria.libraryId, {
                query: criteria.query,
                offset: criteria.offset,
            }),
    })
}

export function readLibrarySong(api: API, libraryId: number, songId: number) {
    return queryOptions({
        queryKey: librarySong(libraryId, songId),
        queryFn: () => api.client.readLibrarySong(libraryId, songId),
    })
}

export interface ReadLibrarySongsCriteria {
    readonly libraryId: number
    readonly query?: string
    readonly albumId?: number
    readonly artistId?: number
    readonly sortBy?: ReadLibrarySongsSortBy
    readonly offset?: number
    readonly limit?: number
}

export function readLibrarySongs(api: API, criteria: ReadLibrarySongsCriteria) {
    return queryOptions({
        queryKey: librarySongs(
            criteria.libraryId,
            criteria.query,
            criteria.albumId,
            criteria.artistId,
            criteria.sortBy,
            criteria.offset,
            criteria.limit,
        ),
        queryFn: () =>
            api.client.readLibrarySongs(criteria.libraryId, {
                query: criteria.query,
                album_id: criteria.albumId,
                artist_id: criteria.artistId,
                sort_by: criteria.sortBy,
                offset: criteria.offset,
                limit: criteria.limit,
            }),
    })
}
