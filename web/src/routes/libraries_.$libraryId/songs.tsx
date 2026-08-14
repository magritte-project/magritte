import type { LibrarySongInput } from "@magritte/sdk"
import { useSuspenseInfiniteQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import classNames from "classnames"
import { useInView } from "motion/react"
import { Fragment, useCallback, useEffect, useMemo, useRef } from "react"
import { z } from "zod"

import { readLibrarySongs } from "@/api/queries/libraries"
import AppForm from "@/components/reusable/AppForm"
import SongSortButton from "@/components/SongSortButton"
import CommandInputProvider from "@/contexts/providers/CommandInputProvider"
import useAPI from "@/hooks/apiHook"
import { useAppForm } from "@/hooks/formHook"
import usePlayer from "@/hooks/playerHook"
import usePlayingItem from "@/hooks/playingItemHook"
import useQueueContext from "@/hooks/queueContextHook"
import useSelection from "@/hooks/selectionHook"
import LibraryQueue from "@/playback/queue/library"
import { resolveNewValue } from "@/utilities/react"

function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

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
                    <table className="w-full">
                        <thead>
                            <tr className="text-left font-semibold text-sm border-b border-separator">
                                <th className="w-px">
                                    <SongSortButton order={sortBy} setOrder={handleChangeSortBy} />
                                </th>
                                <th className="p-2 border-r border-separator">Title</th>
                                <th className="p-2 border-r border-separator">Time</th>
                                <th className="p-2 border-r border-separator">Artist</th>
                                <th className="p-2 border-r border-separator">Album</th>
                                <th className="p-2">Genre</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pages.map((page, index) => (
                                <Fragment key={`songs.pages[${index}`}>
                                    {page.items.map((song) => (
                                        <tr
                                            key={`songs.pages[${index}.songs[${song.id}]`}
                                            className={classNames(
                                                "cursor-pointer bg-secondary odd:bg-inherit hover:bg-key-subtle h-9",
                                                {
                                                    "font-medium": playingItem?.id === song.id,
                                                    "text-red-500": song.sources?.every(
                                                        (source) => source.is_invalid,
                                                    ),
                                                },
                                            )}
                                            draggable={true}
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
                                        >
                                            <td className="w-px px-2 py-1">
                                                <div className="flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        name={`songs[${song.id}]`}
                                                        checked={isSelected(song.id)}
                                                        onChange={() => toggle(song.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        aria-label={
                                                            isSelected(song.id)
                                                                ? "Deselect Song"
                                                                : "Select Song"
                                                        }
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-2 py-1 border-r border-separator">
                                                {song.title}
                                            </td>
                                            <td className="w-px px-2 py-1 border-r border-separator">
                                                <span className="truncate">
                                                    {formatDuration(
                                                        song.end_time - (song.start_time ?? 0),
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-2 py-1 border-r border-separator">
                                                {song.album_title}
                                            </td>
                                            <td className="px-2 py-1 border-r border-separator">
                                                {song.artist_name}
                                            </td>
                                            <td className="px-2 py-1">{song.genre}</td>
                                        </tr>
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
                        </tbody>
                    </table>
                </div>
            </CommandInputProvider>
        )
    },
})
