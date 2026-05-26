import type { Library } from "@magritte/sdk"

import type { APIClient } from "@/api/client"
import type { UserSession } from "@/api/userSession"
import { resolveUrl } from "@/utilities/resources"

// TODO: This should enforce library:read and library:write capabilities

export function exportLibrary(userSession: UserSession | null, apiClient: APIClient): Library {
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
        resolveArtworkImageUrl: async (url) => {
            return resolveUrl(url, userSession)
        },
    }
}
