import type { APIClient } from "@magritte/api"
import type { UserSessionManager } from "@magritte/api"
import type { ExtensionManifest, Library } from "@magritte/sdk"

import { enforcePermissions } from "@/extensions/exports/permissions"
import { resolveUrl } from "@/utilities/resources"

export function exportLibrary(
    manifest: ExtensionManifest,
    userSession: UserSessionManager,
    apiClient: APIClient,
): Library {
    return {
        readLibraries: enforcePermissions(manifest, ["libraries:read"], async () => {
            return (await apiClient.readLibraries()).map((library) => ({
                id: library.id,
                name: library.name,
                home_path: null,
            }))
        }),
        bulkIngestSongs: enforcePermissions(
            manifest,
            ["libraries:write"],
            async ({ libraryId, songs }) => {
                await apiClient.ingestSongs(libraryId, { songs })
            },
        ),
        resolveArtworkImageUrl: enforcePermissions(manifest, ["libraries:read"], async (url) => {
            return resolveUrl(url, userSession.current)
        }),
    }
}
