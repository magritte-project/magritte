import { LibraryInput } from "@magritte/sdk"
import { DiscIcon, MicrophoneIcon, MusicNotesIcon } from "@phosphor-icons/react"
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useCallback, useMemo } from "react"
import { z } from "zod"

import type { Command } from "@/commands/base"
import ModalHeader from "@/components/chrome/ModalHeader"
import PageHeader from "@/components/chrome/PageHeader"
import LibraryAudioFilesUpload from "@/components/library/LibraryAudioFilesUpload"
import Modal from "@/components/reusable/Modal"
import ThemedTabItemLink from "@/components/theme/ThemedTabItemLink"
import CommandInputProvider from "@/contexts/providers/CommandInputProvider"
import CommandsProvider from "@/contexts/providers/CommandsProvider"
import useHotKey from "@/hooks/hotKeyHook"

export const Route = createFileRoute("/libraries_/$libraryId")({
    validateSearch: z.object({
        upload: z.boolean().optional(),
    }),
    component: function LibrariesLayoutComponent() {
        const params = Route.useParams()
        const { upload: isPresentingUpload = false } = Route.useSearch()

        const navigate = useNavigate()
        const presentUpload = useCallback(() => {
            navigate({ to: ".", search: (oldSearch) => ({ ...oldSearch, upload: true }) })
        }, [navigate])
        const dismissUpload = useCallback(() => {
            navigate({ to: ".", search: (oldSearch) => ({ ...oldSearch, upload: undefined }) })
        }, [navigate])
        const commands = useMemo(
            (): readonly Command[] => [
                {
                    id: `libraries.${params.libraryId}.uploadFiles`,
                    searchTerms: "upload audio files",
                    requiredInputKinds: [],
                    present: async () => ({ displayName: "library: Upload Audio Files" }),
                    execute: async () => presentUpload(),
                },
            ],
            [params.libraryId, presentUpload],
        )

        useHotKey({ key: "1" }, () => {
            navigate({ to: "/libraries/$libraryId/artists", params })
            return true
        })
        useHotKey({ key: "2" }, () => {
            navigate({ to: "/libraries/$libraryId/albums", params })
            return true
        })
        useHotKey({ key: "3" }, () => {
            navigate({ to: "/libraries/$libraryId/songs", params })
            return true
        })

        return (
            <CommandInputProvider
                value={[
                    {
                        kind: "library",
                        id: Number(params.libraryId),
                    } satisfies LibraryInput,
                ]}
            >
                <CommandsProvider commands={commands}>
                    <div>
                        <PageHeader>
                            <div className="flex items-center gap-0 drop-shadow-xs">
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
                        </PageHeader>
                        <main>
                            <Outlet />
                        </main>

                        <Modal
                            isPresented={isPresentingUpload}
                            onDismiss={dismissUpload}
                            className="w-100"
                        >
                            <ModalHeader>Upload Audio Files</ModalHeader>
                            <LibraryAudioFilesUpload libraryId={Number(params.libraryId)} />
                        </Modal>
                    </div>
                </CommandsProvider>
            </CommandInputProvider>
        )
    },
})
