import { INGEST_BATCH_MAX_SIZE } from "@magritte/api"
import type { LibraryBulkIngestableSongsInput } from "@magritte/sdk"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { librarySources } from "@/api/keys/librarySources"
import useExtensionHost from "@/hooks/extensionHostHook"

export function useBulkIngestSongsMutation() {
    const extensionHost = useExtensionHost()
    const queryClient = useQueryClient()
    return useMutation({
        // Earlier batches may have been ingested even if a later one failed
        onSettled: () => queryClient.invalidateQueries({ queryKey: librarySources() }),
        mutationFn: async ({ libraryId, songs }: LibraryBulkIngestableSongsInput) => {
            const library = await extensionHost.library()
            for (let start = 0; start < songs.length; start += INGEST_BATCH_MAX_SIZE) {
                await library.bulkIngestSongs({
                    libraryId,
                    songs: songs.slice(start, start + INGEST_BATCH_MAX_SIZE),
                })
            }
        },
    })
}
