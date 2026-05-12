import { useMutation, useQueryClient } from "@tanstack/react-query"

import { libraryAlbums, libraryArtists, librarySongs } from "@/api/keys/libraries"
import type { BulkIngestSongs } from "@/api/openapi"
import useAPIClient from "@/hooks/apiClientHook"

export function useIngestSongs(libraryId: number) {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: BulkIngestSongs) => apiClient.ingestSongs(libraryId, body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: libraryArtists(libraryId),
                exact: false,
            })
            await queryClient.invalidateQueries({
                queryKey: libraryAlbums(libraryId),
                exact: false,
            })
            await queryClient.invalidateQueries({
                queryKey: librarySongs(libraryId),
                exact: false,
            })
        },
    })
}

export function useRequestSyncLibrary(libraryId: number) {
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: () => apiClient.requestSyncLibrary(libraryId),
    })
}
