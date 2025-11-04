import type { APIClient, ReadLibrarySongsSortBy } from "@/api/client"
import { queryOptions } from "@tanstack/react-query"

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

export interface ReadLibraryAlbumsCriteria {
    readonly libraryId: number
    readonly artistId?: number
    readonly offset?: number
    readonly limit?: number
}

export function readLibraryAlbums(
    apiClient: APIClient,
    criteria: ReadLibraryAlbumsCriteria,
) {
    return queryOptions({
        queryKey: [
            "readLibraryAlbums",
            criteria.libraryId,
            criteria.artistId,
            criteria.offset,
            criteria.limit,
        ],
        queryFn: () =>
            apiClient.readLibraryAlbums(
                criteria.libraryId,
                criteria.artistId,
                criteria.offset,
                criteria.limit,
            ),
    })
}

export interface ReadLibraryArtistsCriteria {
    readonly libraryId: number
    readonly offset?: number
    readonly limit?: number
}

export function readLibraryArtists(
    apiClient: APIClient,
    criteria: ReadLibraryArtistsCriteria,
) {
    return queryOptions({
        queryKey: [
            "readLibraryArtists",
            criteria.libraryId,
            criteria.offset,
            criteria.limit,
        ],
        queryFn: () =>
            apiClient.readLibraryArtists(
                criteria.libraryId,
                criteria.offset,
                criteria.limit,
            ),
    })
}

export interface ReadLibrarySongsCriteria {
    readonly libraryId: number
    readonly albumId?: number
    readonly artistId?: number
    readonly sortBy?: ReadLibrarySongsSortBy
    readonly offset?: number
    readonly limit?: number
}

export function readLibrarySongs(
    apiClient: APIClient,
    criteria: ReadLibrarySongsCriteria,
) {
    return queryOptions({
        queryKey: [
            "readLibrarySongs",
            criteria.libraryId,
            criteria.albumId,
            criteria.artistId,
            criteria.offset,
            criteria.limit,
        ],
        queryFn: () =>
            apiClient.readLibrarySongs(
                criteria.libraryId,
                criteria.albumId,
                criteria.artistId,
                criteria.sortBy,
                criteria.offset,
                criteria.limit,
            ),
    })
}
