import type { BulkIngestExistingSongs, BulkIngestSongs } from "@magritte/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { libraryAlbums, libraryArtists, librarySongs } from "@/api/keys/libraries"
import useAPI from "@/hooks/apiHook"

export function useIngestFiles(libraryId: number) {
    const { client } = useAPI()
    return useMutation({
        mutationFn: (body: readonly (File | Blob)[]) => client.ingestFiles(libraryId, [...body]),
    })
}

export function useIngestSongs(libraryId: number) {
    const queryClient = useQueryClient()
    const { client } = useAPI()
    return useMutation({
        mutationFn: (body: BulkIngestSongs) => client.ingestSongs(libraryId, body),
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

export function useIngestExistingSongs(libraryId: number) {
    const queryClient = useQueryClient()
    const { client } = useAPI()
    return useMutation({
        mutationFn: (body: BulkIngestExistingSongs) => client.ingestExistingSongs(libraryId, body),
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
    const { client } = useAPI()
    return useMutation({
        mutationFn: () => client.requestSyncLibrary(libraryId),
    })
}
