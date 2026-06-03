import type { APIClient, ReadLibrarySongsSortBy } from "@magritte/api"
import { infiniteQueryOptions, keepPreviousData, queryOptions } from "@tanstack/react-query"

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

export function readLibraries(apiClient: APIClient) {
    return queryOptions({
        queryKey: libraries(),
        queryFn: () => apiClient.readLibraries(),
    })
}

export function readLibrary(apiClient: APIClient, library_id: number) {
    return queryOptions({
        queryKey: library(library_id),
        queryFn: () => apiClient.readLibrary(library_id),
    })
}

export function readLibraryHomeSubpaths(apiClient: APIClient, relative_to: string) {
    return queryOptions({
        queryKey: [...libraries(), "subpaths", relative_to],
        queryFn: () => apiClient.readLibraryHomeSubpaths(relative_to),
    })
}

export function readLibraryPermissions(apiClient: APIClient, libraryId: number) {
    return queryOptions({
        queryKey: libraryPermissions(libraryId),
        queryFn: () => apiClient.readLibraryPermissions(libraryId),
    })
}

export function readLibraryAlbum(apiClient: APIClient, libraryId: number, albumId: number) {
    return queryOptions({
        queryKey: libraryAlbum(libraryId, albumId),
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
        queryKey: libraryAlbums(
            criteria.libraryId,
            criteria.query,
            criteria.artistId,
            criteria.offset,
            criteria.limit,
        ),
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
        queryKey: libraryArtist(libraryId, artistId),
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
        queryKey: libraryArtists(
            criteria.libraryId,
            criteria.query,
            criteria.offset,
            criteria.limit,
        ),
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
        queryKey: librarySong(libraryId, songId),
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

export function infiniteReadLibrarySongs(
    apiClient: APIClient,
    criteria: Omit<ReadLibrarySongsCriteria, "offset">,
) {
    return infiniteQueryOptions({
        queryKey: librarySongs(
            criteria.libraryId,
            criteria.query,
            criteria.albumId,
            criteria.artistId,
            criteria.sortBy,
            criteria.limit,
        ),
        initialPageParam: { offset: 0 },
        queryFn: ({ pageParam: { offset } }) =>
            apiClient.readLibrarySongs(
                criteria.libraryId,
                criteria.query,
                criteria.albumId,
                criteria.artistId,
                criteria.sortBy,
                offset,
                criteria.limit,
            ),
        getNextPageParam: (lastPage, _allPages) => {
            const offset = lastPage.offset + lastPage.limit
            return offset < lastPage.total ? { offset } : null
        },
        getPreviousPageParam: (lastPage, _allPages) => {
            const offset = lastPage.offset + lastPage.limit
            return offset >= 0 ? { offset } : null
        },
        placeholderData: keepPreviousData,
    })
}
