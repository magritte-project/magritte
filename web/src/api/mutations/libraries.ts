import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { LibraryCreate } from "@/api/openapi"

import { libraries, libraryAlbums, libraryArtists, librarySongs } from "@/api/keys/libraries"
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

export function useDeleteLibrarySong(libraryId: number) {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (songId: number) => apiClient.deleteLibrarySong(libraryId, songId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: libraryAlbums(libraryId),
            })
            await queryClient.invalidateQueries({
                queryKey: libraryArtists(libraryId),
            })
            await queryClient.invalidateQueries({
                queryKey: librarySongs(libraryId),
            })
        },
    })
}
