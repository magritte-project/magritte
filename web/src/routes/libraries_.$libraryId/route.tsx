import { DiscIcon, MicrophoneIcon, MusicNotesIcon, PlusIcon } from "@phosphor-icons/react"
import { useQueryClient } from "@tanstack/react-query"
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router"

import PrimaryHeader from "@/components/chrome/PrimaryHeader"
import ThemedTabItemLink from "@/components/theme/ThemedTabItemLink"
import AppCommandsProvider from "@/contexts/providers/AppCommandsProvider"
import useUserEvents from "@/hooks/userEventsHook"

export const Route = createFileRoute("/libraries_/$libraryId")({
    component: function LibrariesLayoutComponent() {
        const params = Route.useParams()
        const navigate = useNavigate()

        const queryClient = useQueryClient()
        useUserEvents({
            onEvent: async (event) => {
                // TODO: This is nastier than it probably needs to be
                if (event.event_type === "libraries_changed") {
                    for (const libraryId of event.ids) {
                        await queryClient.invalidateQueries({
                            queryKey: ["readLibraryAlbums", libraryId],
                            exact: false,
                        })
                        await queryClient.invalidateQueries({
                            queryKey: ["readLibraryArtists", libraryId],
                            exact: false,
                        })
                        await queryClient.invalidateQueries({
                            queryKey: ["readLibrarySongs", libraryId],
                            exact: false,
                        })
                    }
                }
            },
        })

        return (
            <AppCommandsProvider
                items={[
                    {
                        id: `libraries.${params.libraryId}`,
                        heading: "Library",
                        items: [
                            {
                                id: `libraries.${params.libraryId}.artists`,
                                icon: MicrophoneIcon,
                                children: "Go to Artists",
                                onClick: () =>
                                    navigate({
                                        to: "/libraries/$libraryId/artists",
                                        params,
                                    }),
                            },
                            {
                                id: `libraries.${params.libraryId}.albums`,
                                icon: DiscIcon,
                                children: "Go to Albums",
                                onClick: () =>
                                    navigate({
                                        to: "/libraries/$libraryId/albums",
                                        params,
                                    }),
                            },
                            {
                                id: `libraries.${params.libraryId}.songs`,
                                icon: MusicNotesIcon,
                                children: "Go to Songs",
                                onClick: () =>
                                    navigate({
                                        to: "/libraries/$libraryId/songs",
                                        params,
                                    }),
                            },
                        ],
                    },
                    {
                        id: `libraries.${params.libraryId}.add`,
                        heading: "Add to Library",
                        items: [
                            {
                                id: `libraries.${params.libraryId}.add.songs`,
                                icon: PlusIcon,
                                children: "Add Songs",
                                onClick: () =>
                                    navigate({
                                        to: "/libraries/$libraryId/songs/add",
                                        params,
                                    }),
                            },
                        ],
                    },
                ]}
            >
                <div>
                    <PrimaryHeader>
                        <ThemedTabItemLink
                            to="/libraries/$libraryId/artists"
                            params={params}
                            icon={MicrophoneIcon}
                            label="Artists"
                        />
                        <ThemedTabItemLink
                            to="/libraries/$libraryId/albums"
                            params={params}
                            icon={DiscIcon}
                            label="Albums"
                        />
                        <ThemedTabItemLink
                            to="/libraries/$libraryId/songs"
                            params={params}
                            icon={MusicNotesIcon}
                            label="Songs"
                        />
                    </PrimaryHeader>
                    <main>
                        <Outlet />
                    </main>
                </div>
            </AppCommandsProvider>
        )
    },
})
