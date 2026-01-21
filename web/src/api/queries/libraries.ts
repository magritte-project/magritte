import { queryOptions } from "@tanstack/react-query"

import type { APIClient, ReadLibrarySongsSortBy } from "@/api/client"

export function readLibraries(apiClient: APIClient) {
    return queryOptions({
        queryKey: ["readLibraries"],
        queryFn: () => apiClient.readLibraries(),
    })
}

export function readLibrary(apiClient: APIClient, library_id: number) {
    return queryOptions({
        queryKey: ["readLibrary", library_id],
        queryFn: () => apiClient.readLibrary(library_id),
    })
}

export function readLibraryHomeSubpaths(apiClient: APIClient, relative_to: string) {
    return queryOptions({
        queryKey: ["readLibraryHomeSubpaths", relative_to],
        queryFn: () => apiClient.readLibraryHomeSubpaths(relative_to),
    })
}

export function readLibraryAlbum(apiClient: APIClient, libraryId: number, albumId: number) {
    return queryOptions({
        queryKey: ["readLibraryAlbum", libraryId, albumId],
        queryFn: () => apiClient.readLibraryAlbum(libraryId, albumId),
    })
}

export interface ReadLibraryAlbumsCriteria {
    readonly libraryId: number
    readonly query?: string
    readonly artistId?: number
    readonly offset?: number
    readonly limit?: number
}

export function readLibraryAlbums(apiClient: APIClient, criteria: ReadLibraryAlbumsCriteria) {
    return queryOptions({
        queryKey: [
            "readLibraryAlbums",
            criteria.libraryId,
            criteria.query,
            criteria.artistId,
            criteria.offset,
            criteria.limit,
        ],
        queryFn: () =>
            apiClient.readLibraryAlbums(
                criteria.libraryId,
                criteria.query,
                criteria.artistId,
                criteria.offset,
                criteria.limit,
            ),
    })
}

export function readLibraryArtist(apiClient: APIClient, libraryId: number, artistId: number) {
    return queryOptions({
        queryKey: ["readLibraryArtist", libraryId, artistId],
        queryFn: () => apiClient.readLibraryArtist(libraryId, artistId),
    })
}

export interface ReadLibraryArtistsCriteria {
    readonly libraryId: number
    readonly query?: string
    readonly offset?: number
    readonly limit?: number
}

export function readLibraryArtists(apiClient: APIClient, criteria: ReadLibraryArtistsCriteria) {
    return queryOptions({
        queryKey: [
            "readLibraryArtists",
            criteria.libraryId,
            criteria.query,
            criteria.offset,
            criteria.limit,
        ],
        queryFn: () =>
            apiClient.readLibraryArtists(
                criteria.libraryId,
                criteria.query,
                criteria.offset,
                criteria.limit,
            ),
    })
}

export function readLibrarySong(apiClient: APIClient, libraryId: number, songId: number) {
    return queryOptions({
        queryKey: ["readLibrarySong", libraryId, songId],
        queryFn: () => apiClient.readLibrarySong(libraryId, songId),
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

export function readLibrarySongs(apiClient: APIClient, criteria: ReadLibrarySongsCriteria) {
    return queryOptions({
        queryKey: [
            "readLibrarySongs",
            criteria.libraryId,
            criteria.query,
            criteria.albumId,
            criteria.artistId,
            criteria.offset,
            criteria.limit,
        ],
        queryFn: () =>
            apiClient.readLibrarySongs(
                criteria.libraryId,
                criteria.query,
                criteria.albumId,
                criteria.artistId,
                criteria.sortBy,
                criteria.offset,
                criteria.limit,
            ),
    })
}
