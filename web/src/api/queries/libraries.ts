import * as api from "@/api/client"
import { queryOptions } from "@tanstack/react-query"

export function readLibraries() {
    return queryOptions({
        queryKey: ["readLibraries"],
        queryFn: () => api.readLibraries(),
    })
}

export function readLibrary(library_id: number) {
    return queryOptions({
        queryKey: ["readLibrary", library_id],
        queryFn: () => api.readLibrary(library_id),
    })
}

export function readLibraryAlbums(
    library_id: number,
    artist_id?: number,
    offset?: number,
    limit?: number,
) {
    return queryOptions({
        queryKey: ["readLibraryAlbums", library_id, artist_id, offset, limit],
        queryFn: () =>
            api.readLibraryAlbums(library_id, artist_id, offset, limit),
    })
}

export function readLibraryArtists(
    library_id: number,
    offset?: number,
    limit?: number,
) {
    return queryOptions({
        queryKey: ["readLibraryArtists", library_id, offset, limit],
        queryFn: () => api.readLibraryArtists(library_id, offset, limit),
    })
}

export function readLibrarySongs(
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
            api.readLibrarySongs(
                library_id,
                album_id,
                artist_id,
                offset,
                limit,
            ),
    })
}
