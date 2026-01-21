import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { LibraryCreate, SongUpdate } from "@/api/openapi"

import {
    libraries,
    libraryAlbums,
    libraryArtists,
    librarySong,
    librarySongs,
} from "@/api/keys/libraries"
import useAPIClient from "@/hooks/apiClientHook"

export function useCreateLibrary() {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: LibraryCreate) => apiClient.createLibrary(body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: libraries() })
        },
    })
}

export function useUpdateLibrarySong(libraryId: number, songId: number) {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: SongUpdate) => apiClient.updateLibrarySong(libraryId, songId, body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: librarySong(libraryId, songId),
            })
            await queryClient.invalidateQueries({
                queryKey: librarySongs(libraryId),
                exact: false,
            })
        },
    })
}

export function useDeleteLibrarySong(libraryId: number) {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (songId: number) => apiClient.deleteLibrarySong(libraryId, songId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: libraryAlbums(libraryId),
                exact: false,
            })
            await queryClient.invalidateQueries({
                queryKey: libraryArtists(libraryId),
                exact: false,
            })
            await queryClient.invalidateQueries({
                queryKey: librarySongs(libraryId),
                exact: false,
            })
        },
    })
}
