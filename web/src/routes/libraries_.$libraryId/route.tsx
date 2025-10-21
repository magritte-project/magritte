import PlaybackControls from "@/components/PlaybackControls"
import UserSessionButton from "@/components/UserSessionButton"
import AppCommandsProvider from "@/contexts/providers/AppCommandsProvider"
import { DiscIcon, MicrophoneIcon, MusicNotesIcon } from "@phosphor-icons/react"
import {
    Link,
    Outlet,
    createFileRoute,
    useNavigate,
} from "@tanstack/react-router"

export const Route = createFileRoute("/libraries_/$libraryId")({
    component: function LibrariesLayoutComponent() {
        const params = Route.useParams()
        const navigate = useNavigate()
        return (
            <AppCommandsProvider
                items={[
                    {
                        id: `libraries.${params.libraryId}`,
                        heading: "User",
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
                ]}
            >
                <div>
                    <header className="text-sm font-semibold flex items-center gap-4 p-2">
                        <ol className="flex-1 flex items-center justify-center gap-4">
                            <li>
                                <Link
                                    to="/libraries/$libraryId/artists"
                                    params={params}
                                >
                                    {({ isActive }) => (
                                        <div
                                            className="flex flex-col items-center gap-1 data-[active=true]:text-blue-500"
                                            data-active={isActive}
                                        >
                                            <MicrophoneIcon
                                                size="2em"
                                                weight="light"
                                            />
                                            Artists
                                        </div>
                                    )}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/libraries/$libraryId/albums"
                                    params={params}
                                >
                                    {({ isActive }) => (
                                        <div
                                            className="flex flex-col items-center gap-1 data-[active=true]:text-blue-500"
                                            data-active={isActive}
                                        >
                                            <DiscIcon
                                                size="2em"
                                                weight="light"
                                            />
                                            Albums
                                        </div>
                                    )}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/libraries/$libraryId/songs"
                                    params={params}
                                >
                                    {({ isActive }) => (
                                        <div
                                            className="flex flex-col items-center gap-1 data-[active=true]:text-blue-500"
                                            data-active={isActive}
                                        >
                                            <MusicNotesIcon
                                                size="2em"
                                                weight="light"
                                            />
                                            Songs
                                        </div>
                                    )}
                                </Link>
                            </li>
                        </ol>
                        <PlaybackControls />
                        <UserSessionButton />
                    </header>
                    <main>
                        <Outlet />
                    </main>
                </div>
            </AppCommandsProvider>
        )
    },
})
