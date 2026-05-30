import type { QueryClient } from "@tanstack/react-query"
import type { RegisteredRouter } from "@tanstack/react-router"

import type { APIClient } from "@/api/client"
import { libraryAlbums, libraryArtists, librarySongs } from "@/api/keys/libraries"
import type { Command } from "@/commands/base"
import { LibraryInput, LibrarySongInput } from "@/commands/inputs/libraryInput"

export function libraryCommands(
    router: RegisteredRouter,
    apiClient: APIClient,
    queryClient: QueryClient,
): Command[] {
    return [
        {
            id: `libraries.artists`,
            searchTerms: "library artists",
            present: async (inputs) => ({
                displayName: "library: Artists",
                disabled: !inputs.hasAny("library", LibraryInput),
            }),
            execute: async (inputs) => {
                const [library] = inputs.allOf("library", LibraryInput)
                router.navigate({
                    to: "/libraries/$libraryId/artists",
                    params: { libraryId: String(library.id) },
                })
            },
        },
        {
            id: `libraries.albums`,
            searchTerms: "library albums",
            present: async (inputs) => ({
                displayName: "library: Albums",
                disabled: !inputs.hasAny("library", LibraryInput),
            }),
            execute: async (inputs) => {
                const [library] = inputs.allOf("library", LibraryInput)
                router.navigate({
                    to: "/libraries/$libraryId/albums",
                    params: { libraryId: String(library.id) },
                })
            },
        },
        {
            id: `libraries.songs`,
            searchTerms: "library songs",
            present: async (inputs) => ({
                displayName: "library: Songs",
                disabled: !inputs.hasAny("library", LibraryInput),
            }),
            execute: async (inputs) => {
                const [library] = inputs.allOf("library", LibraryInput)
                router.navigate({
                    to: "/libraries/$libraryId/songs",
                    params: { libraryId: String(library.id) },
                })
            },
        },
        {
            id: `libraries.deleteSongs`,
            searchTerms: "library remove delete songs",
            present: async (inputs) => ({
                displayName: "library: Delete Selected Songs…",
                disabled:
                    !inputs.hasAny("library", LibraryInput) ||
                    !inputs.hasAny("library.song", LibrarySongInput),
            }),
            execute: async (inputs) => {
                const [library] = inputs.allOf("library", LibraryInput)
                const songs = inputs.allOf("library.song", LibrarySongInput)
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
