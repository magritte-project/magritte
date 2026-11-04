import type { API, ExtensionManifest } from "@magritte/api"
import type { Library } from "@magritte/sdk"
import type { QueryClient } from "@tanstack/react-query"

import { libraryAlbums, libraryArtists, librarySongs } from "@/api/keys/libraries"
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
                cover_artwork: library.cover_artwork,
            }))
        }),
        readExtensionSources: enforcePermissions(
            manifest,
            ["libraries:read"],
            async ({ libraryId, offset, limit, extensionTags }) => {
                return await api.client.readAllSources({
                    library_id: libraryId,
                    extension_manifest_id: manifest.id,
                    extension_tags: extensionTags,
                    offset,
                    limit,
                })
            },
        ),
        readArtist: enforcePermissions(
            manifest,
            ["libraries:read"],
            async ({ libraryId, artistId }) => {
                return await api.client.readLibraryArtist(libraryId, artistId)
            },
        ),
        readArtists: enforcePermissions(
            manifest,
            ["libraries:read"],
            async ({ libraryId, ...query }) => {
                return await api.client.readLibraryArtists(libraryId, query)
            },
        ),
        readAlbum: enforcePermissions(
            manifest,
            ["libraries:read"],
            async ({ libraryId, albumId }) => {
                return await api.client.readLibraryAlbum(libraryId, albumId)
            },
        ),
        readAlbums: enforcePermissions(
            manifest,
            ["libraries:read"],
            async ({ libraryId, ...query }) => {
                return await api.client.readLibraryAlbums(libraryId, query)
            },
        ),
        readSong: enforcePermissions(
            manifest,
            ["libraries:read"],
            async ({ libraryId, songId }) => {
                return await api.client.readLibrarySong(libraryId, songId)
            },
        ),
        readSongs: enforcePermissions(
            manifest,
            ["libraries:read"],
            async ({ libraryId, ...query }) => {
                return await api.client.readLibrarySongs(libraryId, query)
            },
        ),
        bulkIngestSongs: enforcePermissions(
            manifest,
            ["libraries:write"],
            async ({ libraryId, songs }) => {
                await api.client.ingestSongs(libraryId, {
                    songs: songs.map((song) => ({ ...song, extension_manifest_id: manifest.id })),
                })
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
