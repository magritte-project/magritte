import UserSessionButton from "@/components/UserSessionButton"
import ThemedTabItemLabel from "@/components/theme/ThemedTabItemLabel"
import AppCommandsProvider from "@/contexts/providers/AppCommandsProvider"
import {
    CaretLeftIcon,
    DiscIcon,
    MicrophoneIcon,
    MusicNotesIcon,
    PlusIcon
} from "@phosphor-icons/react"
import {
    Link,
    Outlet,
    createFileRoute,
    useCanGoBack,
    useNavigate,
    useRouter,
} from "@tanstack/react-router"

export const Route = createFileRoute("/libraries_/$libraryId")({
    component: function LibrariesLayoutComponent() {
        const params = Route.useParams()
        const navigate = useNavigate()
        const { history } = useRouter()
        const canGoBack = useCanGoBack()

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
                    <header className="text-sm font-semibold flex items-center gap-4 p-2">
                        <button
                            type="button"
                            className="px-3 py-2 font-bold rounded-full bg-gray-50 active:bg-gray-100 disabled:bg-transparent disabled:text-gray-300"
                            disabled={!canGoBack}
                            onClick={() => history.back()}
                        >
                            <CaretLeftIcon weight="bold" />
                        </button>
                        <ol className="flex-1 flex items-center justify-center gap-4">
                            <li>
                                <Link
                                    to="/libraries/$libraryId/artists"
                                    params={params}
                                >
                                    {({ isActive }) => (
                                        <ThemedTabItemLabel
                                            isActive={isActive}
                                            icon={MicrophoneIcon}
                                            label="Artists"
                                        />
                                    )}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/libraries/$libraryId/albums"
                                    params={params}
                                >
                                    {({ isActive }) => (
                                        <ThemedTabItemLabel
                                            isActive={isActive}
                                            icon={DiscIcon}
                                            label="Albums"
                                        />
                                    )}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/libraries/$libraryId/songs"
                                    params={params}
                                >
                                    {({ isActive }) => (
                                        <ThemedTabItemLabel
                                            isActive={isActive}
                                            icon={MusicNotesIcon}
                                            label="Songs"
                                        />
                                    )}
                                </Link>
                            </li>
                        </ol>
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
