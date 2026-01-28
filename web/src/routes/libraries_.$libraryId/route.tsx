import { DiscIcon, MicrophoneIcon, MusicNotesIcon, PlusIcon } from "@phosphor-icons/react"
import { ArrowsClockwiseIcon } from "@phosphor-icons/react/dist/ssr"
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useCallback } from "react"

import { useRequestSyncLibrary } from "@/api/mutations/ingest"
import PrimaryHeader from "@/components/chrome/PrimaryHeader"
import ThemedTabItemLink from "@/components/theme/ThemedTabItemLink"
import AppCommandsProvider from "@/contexts/providers/AppCommandsProvider"
import useToast from "@/hooks/toastHook"
import { getErrorMessage } from "@/utilities/errors"

export const Route = createFileRoute("/libraries_/$libraryId")({
    component: function LibrariesLayoutComponent() {
        const params = Route.useParams()
        const navigate = useNavigate()

        const { showToast } = useToast()
        const syncLibraryMutation = useRequestSyncLibrary(Number(params.libraryId))
        const handleSyncLibrary = useCallback(async () => {
            try {
                await syncLibraryMutation.mutateAsync()
            } catch (error) {
                showToast({
                    message: `Failed to start library sync: ${getErrorMessage(error)}`,
                    type: "error",
                })
            }
        }, [syncLibraryMutation, showToast])

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
                            {
                                id: `libraries.${params.libraryId}.add.sync`,
                                icon: ArrowsClockwiseIcon,
                                children: "Sync",
                                onClick: handleSyncLibrary,
                                disabled: syncLibraryMutation.isPending,
                            },
                        ],
                    },
                ]}
            >
                <div>
                    <PrimaryHeader>
                        <div className="flex items-center gap-0">
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
                        </div>
                    </PrimaryHeader>
                    <main>
                        <Outlet />
                    </main>
                </div>
            </AppCommandsProvider>
        )
    },
})
