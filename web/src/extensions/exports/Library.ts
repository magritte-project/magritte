import type { ExtensionManifest, Library } from "@magritte/sdk"

import type { APIClient } from "@/api/client"
import type { UserSessionManager } from "@/api/userSession"
import { checkPermissions } from "@/extensions/exports/permissions"
import { resolveUrl } from "@/utilities/resources"

export function exportLibrary(
    manifest: ExtensionManifest,
    userSession: UserSessionManager,
    apiClient: APIClient,
): Library {
    return {
        readLibraries: checkPermissions(manifest, ["libraries:read"], async () => {
            return (await apiClient.readLibraries()).map((library) => ({
                id: library.id,
                name: library.name,
            }))
        }),
        bulkIngestSongs: checkPermissions(
            manifest,
            ["libraries:write"],
            async ({ libraryId, songs }) => {
                await apiClient.ingestSongs(libraryId, { songs })
            },
        ),
        resolveArtworkImageUrl: checkPermissions(manifest, ["libraries:read"], async (url) => {
            return resolveUrl(url, userSession.current)
        }),
    }
}
