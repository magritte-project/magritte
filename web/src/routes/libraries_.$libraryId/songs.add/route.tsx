import { CheckIcon } from "@phosphor-icons/react"
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router"
import { useCallback, useState } from "react"

import type { IngestSong } from "@/api/openapi"

import useIngestSongs from "@/api/mutations/ingest"
import ModalHeader from "@/components/chrome/ModalHeader"
import AsyncButton from "@/components/reusable/AsyncButton"
import Modal from "@/components/reusable/Modal"
import ThemedButton from "@/components/theme/ThemedButton"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import IngestSongsContextProvider from "@/contexts/providers/IngestSongsContextProvider"

export const Route = createFileRoute("/libraries_/$libraryId/songs/add")({
    component: function AddLayout() {
        const navigate = useNavigate()
        const { libraryId } = Route.useParams()

        const handleDismiss = useCallback(() => {
            navigate({
                to: "/libraries/$libraryId/songs",
                params: { libraryId },
            })
        }, [navigate, libraryId])

        const [songs, setSongs] = useState<readonly IngestSong[]>([])
        const ingestSongs = useIngestSongs(Number(libraryId))
        const isAdded = useCallback(
            (song: IngestSong) => {
                // TODO: This should really do a deep object equality check
                return songs.some(
                    (candidate) =>
                        candidate.title === song.title &&
                        candidate.artist_name === song.artist_name &&
                        candidate.album_title === song.album_title,
                )
            },
            [songs],
        )
        const add = useCallback((newSong: IngestSong) => {
            setSongs((oldSongs) => [...oldSongs, newSong])
        }, [])
        const remove = useCallback((oldSong: IngestSong) => {
            // TODO: This should really do a deep object equality check
            setSongs((oldSongs) =>
                oldSongs.filter(
                    (candidate) =>
                        candidate.title !== oldSong.title ||
                        candidate.artist_name !== oldSong.artist_name ||
                        candidate.album_title !== oldSong.album_title,
                ),
            )
        }, [])
        const flush = useCallback(async () => {
            await ingestSongs.mutateAsync({ songs })
            handleDismiss()
        }, [songs, ingestSongs, handleDismiss])

        return (
            <Modal className="min-w-full md:min-w-[600px]" onDismiss={handleDismiss}>
                <IngestSongsContextProvider value={{ isAdded, add, remove, flush }}>
                    <ModalHeader
                        supplementaryEnd={
                            <AsyncButton
                                buttonComponent={ThemedButton}
                                disabled={songs.length === 0}
                                onClick={flush}
                            >
                                <CheckIcon weight="bold" aria-label="Done" />
                            </AsyncButton>
                        }
                    >
                        Add Songs
                    </ModalHeader>
                    <Outlet />
                </IngestSongsContextProvider>
            </Modal>
        )
    },
    pendingComponent() {
        return <ThemedContentUnavailable />
    },
    errorComponent({ error, reset }) {
        return <ThemedContentUnavailable error={error} onRetry={reset} />
    },
})
