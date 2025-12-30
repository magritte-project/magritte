import type {
    AlbumCreate,
    ArtistCreate,
    LibraryCreate,
    SongCreate,
} from "@/api/openapi"
import {
    readLibraries,
    readLibraryAlbums,
    readLibraryArtists,
    readLibrarySongs,
} from "@/api/queries/libraries"
import useAPIClient from "@/hooks/apiClientHook"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export function useCreateLibrary() {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: LibraryCreate) => apiClient.createLibrary(body),
        onSuccess: async () => {
            await queryClient.invalidateQueries(readLibraries(apiClient))
        },
    })
}

export function useCreateLibraryArtist(libraryId: number) {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: ArtistCreate) =>
            apiClient.createLibraryArtist(libraryId, body),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: readLibraryArtists(apiClient, {
                    libraryId,
                }).queryKey.slice(0, 3),
            })
        },
    })
}

export function useCreateLibraryAlbum(libraryId: number) {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: AlbumCreate) =>
            apiClient.createLibraryAlbum(libraryId, body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: readLibraryAlbums(apiClient, {
                    libraryId,
                }).queryKey.slice(0, 3),
            })
        },
    })
}

export function useCreateLibrarySong(libraryId: number) {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: SongCreate) =>
            apiClient.createLibrarySong(libraryId, body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: readLibrarySongs(apiClient, {
                    libraryId,
                }).queryKey.slice(0, 3),
            })
        },
    })
}
