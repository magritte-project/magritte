import type { LibraryBulkIngestableSongsInput } from "@magritte/sdk/host"
import { useMutation } from "@tanstack/react-query"

import useExtensionHost from "@/hooks/extensionHostHook"

export function useBulkIngestSongsMutation() {
    const extensionHost = useExtensionHost()
    return useMutation({
        mutationFn: async (songs: LibraryBulkIngestableSongsInput) => {
            const library = await extensionHost.library()
            await library.bulkIngestSongs(songs)
        },
    })
}
