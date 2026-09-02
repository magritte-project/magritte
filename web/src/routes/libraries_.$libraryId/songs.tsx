import type { LibrarySongInput } from "@magritte/sdk"
import { useSuspenseInfiniteQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useInView } from "motion/react"
import { Fragment, useCallback, useEffect, useMemo, useRef } from "react"
import { z } from "zod"

import { readLibrarySongs } from "@/api/queries/libraries"
import LibrarySongTable from "@/components/library/LibrarySongTable"
import LibrarySongTableRow from "@/components/library/LibrarySongTableRow"
import AppForm from "@/components/reusable/AppForm"
import CommandInputProvider from "@/contexts/providers/CommandInputProvider"
import useAPI from "@/hooks/apiHook"
import { useAppForm } from "@/hooks/formHook"
import usePlayer from "@/hooks/playerHook"
import usePlayingItem from "@/hooks/playingItemHook"
import useQueueContext from "@/hooks/queueContextHook"
import useSelection from "@/hooks/selectionHook"
import LibraryQueue from "@/playback/queue/library"
import { resolveNewValue } from "@/utilities/react"

export const Route = createFileRoute("/libraries_/$libraryId/songs")({
    validateSearch: z.object({
        query: z.string().optional(),
        album_id: z.number().optional(),
        artist_id: z.number().optional(),
        sort_by: z
            .array(
                z.enum([
                    "+artist_name",
                    "-artist_name",
                    "+album_title",
                    "-album_title",
                    "+title",
                    "-title",
                    "+album_artist",
                    "-album_artist",
                    "+composer",
                    "-composer",
                    "+genre",
                    "-genre",
                    "+release_date",
                    "-release_date",
                    "+track_number",
                    "-track_number",
                    "+track_total",
                    "-track_total",
                    "+disc_number",
                    "-disc_number",
                    "+disc_total",
                    "-disc_total",
                    "+rating",
                    "-rating",
                    "+bpm",
                    "-bpm",
                    "+grouping",
                    "-grouping",
                ]),
            )
            .optional(),
    }),
    component: function LibrarySongsComponent() {
        const { libraryId } = Route.useParams()
        const { query, album_id: albumId, artist_id: artistId, sort_by: sortBy } = Route.useSearch()
        const navigate = Route.useNavigate()
        const api = useAPI()
        const {
            data: { pages },
            hasNextPage,
            fetchNextPage,
        } = useSuspenseInfiniteQuery(
            readLibrarySongs(api, {
                libraryId: Number(libraryId),
                query,
                albumId,
                artistId,
                sortBy,
            }),
        )
        const [total, remaining] = useMemo(() => {
            if (pages.length > 0) {
                const lastPage = pages[pages.length - 1]
                const remaining = lastPage.total - lastPage.offset - lastPage.items.length
                return [lastPage.total, remaining]
            } else {
                return [0, 0] as const
            }
        }, [pages])
        const moreRef = useRef<HTMLTableRowElement | null>(null)
        const isMoreInView = useInView(moreRef)
        useEffect(() => {
            if (isMoreInView && hasNextPage) {
                fetchNextPage()
            }
        }, [isMoreInView, hasNextPage, fetchNextPage])

        const handleChangeSortBy = useCallback(
            (newValue: React.SetStateAction<typeof sortBy>) => {
                navigate({
                    search: (oldValue) => {
                        const sortBy = resolveNewValue(oldValue.sort_by, newValue)
                        return { ...oldValue, sort_by: sortBy }
                    },
                })
            },
            [navigate],
        )

        const queueShardContext = useQueueContext()
        const player = usePlayer()
        const playingItem = usePlayingItem()

        const { selection, isSelected, toggle } = useSelection()
        const commandInputs = useMemo(() => {
            return Array.from(
                selection,
                (id) => ({ kind: "library.song", id }) satisfies LibrarySongInput,
            )
        }, [selection])

        const facetForm = useAppForm({
            defaultValues: {
                query,
            },
            onSubmit({ value }) {
                navigate({ search: (oldSearch) => ({ ...oldSearch, ...value }) })
            },
        })

        return (
            <CommandInputProvider value={commandInputs}>
                <div className="m-2 flex flex-col gap-2 cursor-default">
                    <AppForm form={facetForm}>
                        <facetForm.AppField name="query">
                            {(field) => (
                                <field.InputField
                                    className="w-full"
                                    type="search"
                                    placeholder={`Filter ${Intl.NumberFormat().format(total)} Songs...`}
                                />
                            )}
                        </facetForm.AppField>
                    </AppForm>
                    <LibrarySongTable sortBy={sortBy} onChangeSortBy={handleChangeSortBy}>
                        {pages.map((page, index) => (
                            <Fragment key={`songs.pages[${index}`}>
                                {page.items.map((song) => (
                                    <LibrarySongTableRow
                                        key={`songs.pages[${index}.songs[${song.id}]`}
                                        song={song}
                                        onClick={() =>
                                            player.replaceQueue({
                                                newQueue: new LibraryQueue(
                                                    queueShardContext,
                                                    page,
                                                    {
                                                        libraryId: Number(libraryId),
                                                        albumId,
                                                        artistId,
                                                        sortBy,
                                                    },
                                                ),

                                                startingItem: song,
                                                playNow: true,
                                            })
                                        }
                                        onKeyDown={() => {}}
                                        playing={playingItem?.id === song.id}
                                        selected={isSelected(song.id)}
                                        onToggle={() => toggle(song.id)}
                                    />
                                ))}
                            </Fragment>
                        ))}
                        <tr ref={moreRef}>
                            <td>
                                <div
                                    style={{
                                        minHeight: `calc(${remaining} * var(--spacing) * 9)`,
                                    }}
                                />
                            </td>
                        </tr>
                    </LibrarySongTable>
                </div>
            </CommandInputProvider>
        )
    },
})
