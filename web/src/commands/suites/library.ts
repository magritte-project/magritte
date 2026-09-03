import { getCommandInputKind, LibraryInput, LibrarySongInput } from "@magritte/sdk"
import type { RegisteredRouter } from "@tanstack/react-router"

import { libraryAlbums, libraryArtists, librarySongs } from "@/api/keys/libraries"
import type { Command } from "@/commands/base"
import { getMagritteRouterContext } from "@/integrations/tanstack-router/context"
import { getErrorMessage } from "@/utilities/errors"
import { resolveResourceUrl } from "@/utilities/resources"

export function libraryCommands(router: RegisteredRouter): Command[] {
    return [
        {
            id: `libraries.artists`,
            searchTerms: "library artists",
            requiredInputKinds: [getCommandInputKind(LibraryInput)],
            present: async () => ({
                displayName: "library: Artists",
            }),
            execute: async (inputs) => {
                const [library] = inputs.allOf(LibraryInput)
                router.navigate({
                    to: "/libraries/$libraryId/artists",
                    params: { libraryId: String(library.id) },
                })
            },
        },
        {
            id: `libraries.albums`,
            searchTerms: "library albums",
            requiredInputKinds: [getCommandInputKind(LibraryInput)],
            present: async () => ({
                displayName: "library: Albums",
            }),
            execute: async (inputs) => {
                const [library] = inputs.allOf(LibraryInput)
                router.navigate({
                    to: "/libraries/$libraryId/albums",
                    params: { libraryId: String(library.id) },
                })
            },
        },
        {
            id: `libraries.songs`,
            searchTerms: "library songs",
            requiredInputKinds: [getCommandInputKind(LibraryInput)],
            present: async () => ({
                displayName: "library: Songs",
            }),
            execute: async (inputs) => {
                const [library] = inputs.allOf(LibraryInput)
                router.navigate({
                    to: "/libraries/$libraryId/songs",
                    params: { libraryId: String(library.id) },
                })
            },
        },
        {
            id: `libraries.deleteSongs`,
            searchTerms: "library remove delete songs",
            requiredInputKinds: [
                getCommandInputKind(LibraryInput),
                getCommandInputKind(LibrarySongInput),
            ],
            present: async () => ({
                displayName: "library: Delete Selected Songs…",
            }),
            execute: async (inputs) => {
                const { api, notificationCenter, queryClient } = getMagritteRouterContext(router)
                const [library] = inputs.allOf(LibraryInput)
                const songs = inputs.allOf(LibrarySongInput)

                const confirmed = await notificationCenter.confirm({
                    title: `Are you sure you want to remove ${songs.length} song${songs.length !== 1 ? "s" : ""}?`,
                    message: "This action cannot be undone.",
                    destructive: true,
                    confirmButtonLabel: "Delete",
                })
                if (!confirmed) {
                    return
                }
                try {
                    for (const song of songs) {
                        await api.client.deleteLibrarySong(library.id, song.id)
                    }
                } catch (error) {
                    notificationCenter.showToast({
                        message: `Could not delete library songs: ${getErrorMessage(error)}`,
                        type: "error",
                    })
                }
                await Promise.all([
                    queryClient.invalidateQueries({
                        queryKey: libraryAlbums(library.id),
                        exact: false,
                    }),
                    queryClient.invalidateQueries({
                        queryKey: libraryArtists(library.id),
                        exact: false,
                    }),
                    queryClient.invalidateQueries({
                        queryKey: librarySongs(library.id),
                        exact: false,
                    }),
                ])
            },
        },
        {
            id: `libraries.downloadSongs`,
            searchTerms: "library download songs",
            requiredInputKinds: [
                getCommandInputKind(LibraryInput),
                getCommandInputKind(LibrarySongInput),
            ],
            present: async () => ({
                displayName: "library: Download Selected Songs…",
            }),
            execute: async (inputs) => {
                const [library] = inputs.allOf(LibraryInput)
                const songs = inputs.allOf(LibrarySongInput)
                const { api, notificationCenter, localCache } = getMagritteRouterContext(router)
                const librarySongs = await Promise.all(
                    songs.map((song) => api.client.readLibrarySong(library.id, song.id)),
                )
                const sources = librarySongs.flatMap((song) => {
                    const source = song.sources?.find((source) =>
                        source.url.startsWith("magritte://"),
                    )
                    return source !== undefined ? [source] : []
                })
                const existingFiles = await localCache.filesExist(
                    sources.map((source) => source.url),
                )
                let downloadCount = 0
                for (const source of sources) {
                    if (existingFiles.has(source.url)) {
                        console.debug(`Skipping already downloaded source: ${source.url}`)
                        continue
                    }
                    console.debug(`Downloading source: ${source.url}`)
                    try {
                        const token = await api.fileAccess.token()
                        const url = resolveResourceUrl(source.url, token)
                        if (url === undefined) {
                            throw new Error("Could not resolve song source URL")
                        }
                        const response = await fetch(url)
                        const contents = await response.blob()
                        await localCache.putFile(source.url, contents)
                        console.debug(`Downloaded source: ${source.url}`)
                        downloadCount++
                    } catch (error) {
                        notificationCenter.showToast({
                            message: `Could not download library song: ${getErrorMessage(error)}`,
                            type: "error",
                        })
                    }
                }
                if (downloadCount > 0) {
                    notificationCenter.showToast({
                        message: `Downloaded ${downloadCount} song(s)`,
                        type: "info",
                    })
                }
            },
        },
        {
            id: "libraries.requestSync",
            searchTerms: "library sync files",
            requiredInputKinds: [getCommandInputKind(LibraryInput)],
            present: async () => ({
                displayName: "library: Request Sync",
            }),
            execute: async (inputs) => {
                const libraries = inputs.allOf(LibraryInput)
                const { api } = getMagritteRouterContext(router)
                await Promise.all(
                    libraries.map((library) => api.client.requestSyncLibrary(library.id)),
                )
            },
        },
    ]
}
