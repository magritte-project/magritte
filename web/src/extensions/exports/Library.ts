import type { Library } from "@magritte/sdk/host"

import type { APIClient } from "@/api/client"

// TODO: This should enforce library:read and library:write capabilities

export function exportLibrary(apiClient: APIClient): Library {
    return {
        readLibraries: async () => {
            return (await apiClient.readLibraries()).map((library) => ({
                id: library.id,
                name: library.name,
            }))
        },
        bulkIngestSongs: async ({ libraryId, songs }) => {
            await apiClient.ingestSongs(libraryId, { songs })
        },
    }
}
