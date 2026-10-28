import { getErrorMessage } from "@magritte/rpc"
import { getCommandInputKind, LibraryInputSchema, LibrarySongInputSchema } from "@magritte/sdk"
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMemo } from "react"

import { libraryArtists, libraryAlbums, librarySongs } from "@/api/keys/libraries"
import { readLibraries } from "@/api/queries/libraries"
import type { Command } from "@/commands/base"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import CommandsProvider from "@/contexts/providers/CommandsProvider"
import useAPI from "@/hooks/apiHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"

export const Route = createFileRoute("/libraries")({
    component: function LibrariesLayout() {
        const navigate = useNavigate()
        const queryClient = useQueryClient()
        const notificationCenter = useNotificationCenter()
        const api = useAPI()
        const { data: libraries } = useSuspenseQuery(readLibraries(api))

        const libraryCommands = useMemo(
            () =>
                libraries.flatMap((library): Command[] => [
                    {
                        id: `libraries.${library.id}.view`,
                        searchTerms: `library ${library.name}`,
                        highlightAvailability: false,
                        requiredInputKinds: [],
                        present: async () => ({ displayName: library.name, disabled: false }),
                        execute: async () =>
                            navigate({
                                to: "/libraries/$libraryId",
                                params: { libraryId: String(library.id) },
                            }),
                    },
                    {
                        id: `libraries.${library.id}.copySong`,
                        searchTerms: "library add copy song",
                        highlightAvailability: false,
                        requiredInputKinds: [
                            getCommandInputKind(LibraryInputSchema),
                            getCommandInputKind(LibrarySongInputSchema),
                        ],
                        present: async (inputs) => ({
                            displayName: `library: Add song to ${library.name}`,
                            disabled: !inputs
                                .allOf(LibraryInputSchema)
                                .some((input) => input.id !== library.id),
                        }),
                        execute: async (inputs) => {
                            try {
                                await api.client.ingestExistingSongs(library.id, {
                                    existing_song_ids: inputs
                                        .allOf(LibrarySongInputSchema)
                                        .map((input) => input.id),
                                })
                                await queryClient.invalidateQueries({
                                    queryKey: libraryArtists(library.id),
                                    exact: false,
                                })
                                await queryClient.invalidateQueries({
                                    queryKey: libraryAlbums(library.id),
                                    exact: false,
                                })
                                await queryClient.invalidateQueries({
                                    queryKey: librarySongs(library.id),
                                    exact: false,
                                })
                            } catch (error) {
                                notificationCenter.showToast({
                                    message: `Could not add song: ${getErrorMessage(error)}`,
                                    type: "error",
                                })
                            }
                        },
                    },
                ]),
            [navigate, libraries, api, queryClient, notificationCenter],
        )
        return (
            <CommandsProvider commands={libraryCommands}>
                <Outlet />
            </CommandsProvider>
        )
    },
    pendingComponent() {
        return <ThemedContentUnavailable />
    },
    errorComponent({ error, reset }) {
        return <ThemedContentUnavailable error={error} onRetry={reset} />
    },
})
