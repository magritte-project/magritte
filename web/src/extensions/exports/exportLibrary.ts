import type { APIClient, ExtensionManifest, FileAccess } from "@magritte/api"
import type { Library } from "@magritte/sdk"

import { enforcePermissions } from "@/extensions/exports/permissions"
import { resolveUrl } from "@/utilities/resources"

export function exportLibrary(
    manifest: ExtensionManifest,
    apiClient: APIClient,
    fileAccess: FileAccess,
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
            const token = await fileAccess.token()
            return resolveUrl(url, token)
        }),
    }
}
