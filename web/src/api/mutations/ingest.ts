import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { BulkIngestSongs } from "@/api/openapi"

import { readLibraryAlbums, readLibraryArtists, readLibrarySongs } from "@/api/queries/libraries"
import useAPIClient from "@/hooks/apiClientHook"

export default function useIngestSongs(libraryId: number) {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: BulkIngestSongs) => apiClient.ingestSongs(libraryId, body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: readLibraryArtists(apiClient, {
                    libraryId,
                }).queryKey.slice(0, 3),
            })
            await queryClient.invalidateQueries({
                queryKey: readLibraryAlbums(apiClient, {
                    libraryId,
                }).queryKey.slice(0, 3),
            })
            await queryClient.invalidateQueries({
                queryKey: readLibrarySongs(apiClient, {
                    libraryId,
                }).queryKey.slice(0, 3),
            })
        },
    })
}
