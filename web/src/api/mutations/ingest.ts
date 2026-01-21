import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { BulkIngestSongs } from "@/api/openapi"

import { libraryAlbums, libraryArtists, librarySongs } from "@/api/keys/libraries"
import useAPIClient from "@/hooks/apiClientHook"

export default function useIngestSongs(libraryId: number) {
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
