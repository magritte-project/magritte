import useIngestSongs from "@/api/mutations/ingest"
import type { IngestSong } from "@/api/openapi"
import { readAvailableServices } from "@/api/queries/services"
import ModalHeader from "@/components/chrome/ModalHeader"
import AsyncButton from "@/components/reusable/AsyncButton"
import Modal from "@/components/reusable/Modal"
import ThemedButton from "@/components/theme/ThemedButton"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import IngestSongsContextProvider from "@/contexts/providers/IngestSongsContextProvider"
import useAPIClient from "@/hooks/apiClientHook"
import { CheckIcon } from "@phosphor-icons/react"
import { useSuspenseQuery } from "@tanstack/react-query"
import {
    createFileRoute,
    Outlet,
    useNavigate,
    useParams,
} from "@tanstack/react-router"
import { useCallback, useState } from "react"

export const Route = createFileRoute("/libraries_/$libraryId/songs/add")({
    component: function AddLayout() {
        const apiClient = useAPIClient()
        const { data: availableServices } = useSuspenseQuery(
            readAvailableServices(apiClient),
        )
        const navigate = useNavigate()
        const { libraryId } = Route.useParams()
        const { service: selectedService } = useParams({ strict: false })

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
        const add = useCallback((newSongs: readonly IngestSong[]) => {
            setSongs((oldSongs) => [...oldSongs, ...newSongs])
        }, [])
        const flush = useCallback(async () => {
            await ingestSongs.mutateAsync({ songs })
            handleDismiss()
        }, [songs, ingestSongs, handleDismiss])

        return (
            <Modal
                className="min-w-full md:min-w-[600px]"
                onDismiss={handleDismiss}
            >
                <IngestSongsContextProvider value={{ isAdded, add, flush }}>
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
                        {availableServices.map((service) => (
                            <button
                                key={service.name}
                                type="button"
                                className={`
                                        font-semibold text-sm select-none
                                        px-2 py-1 cursor-pointer 
                                        border border-blue-600 first:rounded-l-md last:rounded-r-md
                                        bg-white text-blue-600
                                        data-active:bg-blue-600 data-active:text-white
                                    `}
                                data-active={
                                    selectedService === service.name
                                        ? ""
                                        : undefined
                                }
                                onKeyDown={() => {}}
                                onClick={() =>
                                    navigate({
                                        to: "/libraries/$libraryId/songs/add/$service",
                                        params: {
                                            libraryId,
                                            service: service.name,
                                        },
                                    })
                                }
                            >
                                {service.display_name}
                            </button>
                        ))}
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
