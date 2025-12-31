import PrimaryHeader from "@/components/chrome/PrimaryHeader"
import ThemedTabItemLink from "@/components/theme/ThemedTabItemLink"
import AppCommandsProvider from "@/contexts/providers/AppCommandsProvider"
import {
    DiscIcon,
    MicrophoneIcon,
    MusicNotesIcon,
    PlusIcon,
} from "@phosphor-icons/react"
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router"

export const Route = createFileRoute("/libraries_/$libraryId")({
    component: function LibrariesLayoutComponent() {
        const params = Route.useParams()
        const navigate = useNavigate()

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
                            {
                                id: `libraries.${params.libraryId}.songs.add`,
                                icon: PlusIcon,
                                children: "Add Song",
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
