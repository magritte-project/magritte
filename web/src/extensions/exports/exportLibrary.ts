import type { API, ExtensionManifest } from "@magritte/api"
import type { Library } from "@magritte/sdk"

import { enforcePermissions } from "@/extensions/exports/permissions"
import { resolveUrl } from "@/utilities/resources"

export function exportLibrary(manifest: ExtensionManifest, api: API): Library {
    return {
        readLibraries: enforcePermissions(manifest, ["libraries:read"], async () => {
            return (await api.client.readLibraries()).map((library) => ({
                id: library.id,
                name: library.name,
                home_path: null,
            }))
        }),
        bulkIngestSongs: enforcePermissions(
            manifest,
            ["libraries:write"],
            async ({ libraryId, songs }) => {
                await api.client.ingestSongs(libraryId, { songs })
            },
        ),
        resolveArtworkImageUrl: enforcePermissions(manifest, ["libraries:read"], async (url) => {
            const token = await api.fileAccess.token()
            return resolveUrl(url, token)
        }),
    }
}
