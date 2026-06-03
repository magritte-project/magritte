import type { APIClient } from "@magritte/api"
import { getCommandInputKind, LibraryInput, LibrarySongInput } from "@magritte/sdk"
import type { QueryClient } from "@tanstack/react-query"
import type { RegisteredRouter } from "@tanstack/react-router"

import { libraryAlbums, libraryArtists, librarySongs } from "@/api/keys/libraries"
import type { Command } from "@/commands/base"

export function libraryCommands(
    router: RegisteredRouter,
    apiClient: APIClient,
    queryClient: QueryClient,
): Command[] {
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
                const [library] = inputs.allOf(LibraryInput)
                const songs = inputs.allOf(LibrarySongInput)
                const confirmed = confirm(
                    `Are you sure you want to remove ${songs.length} song${songs.length !== 1 ? "s" : ""}?`,
                )
                if (!confirmed) {
                    return
                }
                for (const song of songs) {
                    await apiClient.deleteLibrarySong(library.id, song.id)
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
    ]
}
