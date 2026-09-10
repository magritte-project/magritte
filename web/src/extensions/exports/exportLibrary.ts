import type { API, ExtensionManifest } from "@magritte/api"
import type { Library } from "@magritte/sdk"
import type { QueryClient } from "@tanstack/react-query"

import { libraryArtists, libraryAlbums, librarySongs } from "@/api/keys/libraries"
import { enforcePermissions } from "@/extensions/exports/permissions"
import { resolveResourceUrl } from "@/utilities/resources"

export function exportLibrary(
    manifest: ExtensionManifest,
    queryClient: QueryClient,
    api: API,
): Library {
    return {
        readLibraries: enforcePermissions(manifest, ["libraries:read"], async () => {
            return (await api.client.readLibraries()).map((library) => ({
                id: library.id,
                name: library.name,
                home_path: null,
                uploads_enabled: false,
            }))
        }),
        bulkIngestSongs: enforcePermissions(
            manifest,
            ["libraries:write"],
            async ({ libraryId, songs }) => {
                await api.client.ingestSongs(libraryId, { songs })
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
        ),
        resolveArtworkImageUrl: enforcePermissions(manifest, ["libraries:read"], async (url) => {
            const token = await api.fileAccess.token()
            return resolveResourceUrl(url, token)
        }),
    }
}
