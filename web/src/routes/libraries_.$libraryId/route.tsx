import { DiscIcon, MicrophoneIcon, MusicNotesIcon } from "@phosphor-icons/react"
import { Outlet, createFileRoute } from "@tanstack/react-router"

import { LibraryInput } from "@/commands/inputs/libraryInput"
import NowPlayingBlob from "@/components/chrome/NowPlayingBlob"
import PrimaryHeader from "@/components/chrome/PrimaryHeader"
import ThemedTabItemLink from "@/components/theme/ThemedTabItemLink"
import CommandInputContextProvider from "@/contexts/providers/CommandInputContextProvider"

export const Route = createFileRoute("/libraries_/$libraryId")({
    component: function LibrariesLayoutComponent() {
        const params = Route.useParams()

        return (
            <CommandInputContextProvider
                schema={LibraryInput}
                value={{
                    kind: "library",
                    id: Number(params.libraryId),
                }}
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
                <NowPlayingBlob />
            </CommandInputContextProvider>
        )
    },
})
