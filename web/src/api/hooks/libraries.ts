import {
    createLibrary,
    readLibraries,
    readLibrary,
    readLibraryAlbums,
    readLibraryArtists,
    readLibrarySongs,
} from "@/api/client"
import { useMutation, useSuspenseQuery } from "@tanstack/react-query"

export function useReadLibrariesQuery() {
    return useSuspenseQuery({
        queryKey: ["/libraries/"],
        queryFn: () => readLibraries(),
    })
}

export function useCreateLibraryMutation() {
    return useMutation({
        mutationFn: createLibrary,
    })
}

export function useReadLibraryQuery(library_id: number) {
    return useSuspenseQuery({
        queryKey: ["/libraries/{library_id}", library_id],
        queryFn: () => readLibrary(library_id),
    })
}

export function useReadLibraryAlbumsQuery(
    library_id: number,
    artist_id?: number,
    offset?: number,
    limit?: number,
) {
    return useSuspenseQuery({
        queryKey: [
            "/libraries/{library_id}/albums",
            library_id,
            artist_id,
            offset,
            limit,
        ],
        queryFn: () => readLibraryAlbums(library_id, artist_id, offset, limit),
    })
}

export function useReadLibraryArtistsQuery(
    library_id: number,
    offset?: number,
    limit?: number,
) {
    return useSuspenseQuery({
        queryKey: [
            "/libraries/{library_id}/artists",
            library_id,
            offset,
            limit,
        ],
        queryFn: () => readLibraryArtists(library_id, offset, limit),
    })
}

export function useReadLibrarySongsQuery(
    library_id: number,
    album_id?: number,
    artist_id?: number,
    offset?: number,
    limit?: number,
) {
    return useSuspenseQuery({
        queryKey: [
            "/libraries/{library_id}/songs",
            library_id,
            album_id,
            artist_id,
            offset,
            limit,
        ],
        queryFn: () =>
            readLibrarySongs(library_id, album_id, artist_id, offset, limit),
    })
}
