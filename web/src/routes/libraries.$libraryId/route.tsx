import type { LibraryInput } from "@magritte/sdk"
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useCallback, useMemo } from "react"
import { z } from "zod"

import type { Command } from "@/commands/base"
import ModalHeader from "@/components/chrome/ModalHeader"
import LibraryAudioFilesUpload from "@/components/library/LibraryAudioFilesUpload"
import Modal from "@/components/reusable/Modal"
import CommandInputProvider from "@/contexts/providers/CommandInputProvider"
import CommandsProvider from "@/contexts/providers/CommandsProvider"

export const Route = createFileRoute("/libraries/$libraryId")({
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
            navigate({
                to: ".",
                search: (oldSearch) => ({ ...oldSearch, upload: undefined }),
                replace: true,
            })
        }, [navigate])
        const commands = useMemo(
            (): readonly Command[] => [
                {
                    id: `libraries.${params.libraryId}.uploadFiles`,
                    searchTerms: "upload audio files",
                    requiredInputKinds: [],
                    highlightAvailability: false,
                    present: async () => ({ displayName: "library: Upload Audio Files" }),
                    execute: async () => presentUpload(),
                },
            ],
            [params.libraryId, presentUpload],
        )

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
                    <Outlet />

                    <Modal
                        isPresented={isPresentingUpload}
                        onDismiss={dismissUpload}
                        className="w-100"
                    >
                        <ModalHeader>Upload Audio Files</ModalHeader>
                        <LibraryAudioFilesUpload libraryId={Number(params.libraryId)} />
                    </Modal>
                </CommandsProvider>
            </CommandInputProvider>
        )
    },
})
