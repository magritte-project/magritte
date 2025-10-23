import type { APIClient } from "@/api/client"
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

export function readLibraryAlbums(
    apiClient: APIClient,
    library_id: number,
    artist_id?: number,
    offset?: number,
    limit?: number,
) {
    return queryOptions({
        queryKey: ["readLibraryAlbums", library_id, artist_id, offset, limit],
        queryFn: () =>
            apiClient.readLibraryAlbums(library_id, artist_id, offset, limit),
    })
}

export function readLibraryArtists(
    apiClient: APIClient,
    library_id: number,
    offset?: number,
    limit?: number,
) {
    return queryOptions({
        queryKey: ["readLibraryArtists", library_id, offset, limit],
        queryFn: () => apiClient.readLibraryArtists(library_id, offset, limit),
    })
}

export function readLibrarySongs(
    apiClient: APIClient,
    library_id: number,
    album_id?: number,
    artist_id?: number,
    offset?: number,
    limit?: number,
) {
    return queryOptions({
        queryKey: [
            "readLibrarySongs",
            library_id,
            album_id,
            artist_id,
            offset,
            limit,
        ],
        queryFn: () =>
            apiClient.readLibrarySongs(
                library_id,
                album_id,
                artist_id,
                offset,
                limit,
            ),
    })
}
