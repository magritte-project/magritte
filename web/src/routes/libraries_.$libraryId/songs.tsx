import { TAG_MAX_LENGTH } from "@magritte/api"
import type { LibrarySongInput } from "@magritte/sdk"
import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useDebounce } from "@uidotdev/usehooks"
import { useInView } from "motion/react"
import { Fragment, useCallback, useMemo, useRef } from "react"
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
        const { data: firstPage } = useSuspenseQuery(
            readLibrarySongs(api, {
                libraryId: Number(libraryId),
                query,
                albumId,
                artistId,
                sortBy,
            }),
        )
        const pageOffsets = useMemo(() => {
            const length = Math.ceil((firstPage.total - firstPage.limit) / firstPage.limit)
            return Array.from({ length }, (_, i) =>
                Math.min(firstPage.limit * (i + 1), firstPage.total),
            )
        }, [firstPage])

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
                        <facetForm.AppField
                            name="query"
                            validators={{
                                onChange: z
                                    .string()
                                    .max(TAG_MAX_LENGTH, { error: "Query is too long" }),
                            }}
                        >
                            {(field) => (
                                <field.SearchInputField
                                    className="w-full"
                                    placeholder={`Find in ${Intl.NumberFormat().format(firstPage.total)} songs...`}
                                />
                            )}
                        </facetForm.AppField>
                    </AppForm>
                    <LibrarySongTable sortBy={sortBy} onChangeSortBy={handleChangeSortBy}>
                        {firstPage.items.map((song) => (
                            <LibrarySongTableRow
                                key={`songs[${song.id}]`}
                                song={song}
                                onClick={() =>
                                    player.replaceQueue({
                                        newQueue: new LibraryQueue(queueShardContext, firstPage, {
                                            libraryId: Number(libraryId),
                                            albumId,
                                            artistId,
                                            sortBy,
                                        }),

                                        startingItem: song,
                                        playNow: true,
                                    })
                                }
                                onKeyDown={() => {}}
                                playing={playingItem?.id === song.id}
                                selected={isSelected(song.id)}
                                onToggleSelected={() => toggle(song.id)}
                            />
                        ))}
                        {pageOffsets.map((offset, index) => (
                            <SongPageFragment
                                key={`songs.pages[${index}]`}
                                isSelected={isSelected}
                                toggle={toggle}
                                offset={offset}
                                limit={firstPage.limit}
                            />
                        ))}
                    </LibrarySongTable>
                </div>
            </CommandInputProvider>
        )
    },
})

interface SongPageFragmentProps {
    readonly query?: string
    readonly isSelected: (id: number) => boolean
    readonly toggle: (id: number) => void
    readonly offset: number
    readonly limit: number
}

function SongPageFragment({ isSelected, toggle, offset, limit }: SongPageFragmentProps) {
    const { libraryId } = Route.useParams()
    const { query, album_id: albumId, artist_id: artistId, sort_by: sortBy } = Route.useSearch()

    const moreRef = useRef<HTMLTableRowElement | null>(null)
    const isMoreInView = useInView(moreRef)
    const enabled = useDebounce(isMoreInView, 300)

    const api = useAPI()
    const pageQuery = useQuery({
        ...readLibrarySongs(api, {
            libraryId: Number(libraryId),
            query,
            albumId,
            artistId,
            sortBy,
            offset,
        }),
        enabled,
    })

    const queueShardContext = useQueueContext()
    const player = usePlayer()
    const playingItem = usePlayingItem()

    return pageQuery.isSuccess ? (
        <Fragment>
            {pageQuery.data.items.map((song) => (
                <LibrarySongTableRow
                    key={`songs[${song.id}]`}
                    song={song}
                    onClick={() =>
                        player.replaceQueue({
                            newQueue: new LibraryQueue(queueShardContext, pageQuery.data, {
                                libraryId: Number(libraryId),
                                albumId,
                                artistId,
                                sortBy,
                            }),

                            startingItem: song,
                            playNow: true,
                        })
                    }
                    onKeyDown={() => {}}
                    playing={playingItem?.id === song.id}
                    selected={isSelected(song.id)}
                    onToggleSelected={() => toggle(song.id)}
                />
            ))}
        </Fragment>
    ) : (
        !pageQuery.isError && (
            <tr ref={moreRef}>
                <td>
                    <div style={{ minHeight: `calc(${limit} * var(--spacing) * 9)` }} />
                </td>
            </tr>
        )
    )
}
