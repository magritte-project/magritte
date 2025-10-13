import UserSessionButton from "@/components/UserSessionButton"
import { DiscIcon, MicrophoneIcon, MusicNotesIcon } from "@phosphor-icons/react"
import { Link, Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/libraries_/$libraryId")({
    component: function LibrariesLayoutComponent() {
        const params = Route.useParams()
        return (
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
                                        <DiscIcon size="2em" weight="light" />
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
                    <UserSessionButton />
                </header>
                <main>
                    <Outlet />
                </main>
            </div>
        )
    },
})
