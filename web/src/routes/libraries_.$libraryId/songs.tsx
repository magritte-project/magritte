import { MenuButton } from "@headlessui/react"
import { DotsThreeCircleVerticalIcon, TrashIcon } from "@phosphor-icons/react"
import { PencilIcon } from "@phosphor-icons/react/dist/ssr"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router"
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { useCallback, useMemo } from "react"
import { z } from "zod"

import type { SongRead } from "@/api/openapi"

import { useDeleteLibrarySong } from "@/api/mutations/libraries"
import { readLibrarySongs } from "@/api/queries/libraries"
import AppForm from "@/components/reusable/AppForm"
import TableFooter from "@/components/reusable/TableFooter"
import SongSortButton from "@/components/SongSortButton"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import ThemedPopUpMenu from "@/components/theme/ThemedPopUpMenu"
import useAPIClient from "@/hooks/apiClientHook"
import { useAppForm } from "@/hooks/formHook"
import usePlayer from "@/hooks/playerHook"
import useQueueContext from "@/hooks/queueContextHook"
import useSplits from "@/hooks/splitsHook"
import LibraryQueue from "@/playback/queue/library"
import { SongEditorSplit } from "@/splits/definitions/SongEditorSplit"
import { resolveNewValue } from "@/utilities/react"

const columnHelper = createColumnHelper<SongRead>()

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
        offset: z.number().optional(),
    }),
    component: function LibrarySongsComponent() {
        const { libraryId } = Route.useParams()
        const {
            query,
            album_id: albumId,
            artist_id: artistId,
            sort_by: sortBy,
            offset,
        } = Route.useSearch()
        const navigate = useNavigate({ from: Route.fullPath })
        const apiClient = useAPIClient()
        const pageQuery = useQuery(
            readLibrarySongs(apiClient, {
                libraryId: Number(libraryId),
                query,
                albumId,
                artistId,
                sortBy,
                offset,
            }),
        )

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

        const handleSongDrag = useCallback(
            (e: React.DragEvent<HTMLTableRowElement>, song: SongRead) => {
                e.dataTransfer.setData(
                    "text/plain",
                    `${song.title} - ${song.album_title} - ${song.artist_name}`,
                )
                e.dataTransfer.setData("x-magritte/song", JSON.stringify(song))
            },
            [],
        )

        const { openSplit } = useSplits()
        const handleEdit = useCallback(
            (song: SongRead) => {
                openSplit({
                    id: SongEditorSplit.id,
                    parameters: [Number(libraryId), song.id],
                })
            },
            [libraryId, openSplit],
        )

        const deleteLibrarySong = useDeleteLibrarySong(Number(libraryId))
        const handleRemove = useCallback(
            async (song: SongRead) => {
                const confirmed = confirm(`Are you sure you want to remove ${song.title}?`)
                if (!confirmed) {
                    return
                }
                await deleteLibrarySong.mutateAsync(song.id)
            },
            [deleteLibrarySong],
        )

        const queueShardContext = useQueueContext()
        const player = usePlayer()

        const facetForm = useAppForm({
            defaultValues: {
                query,
            },
            onSubmit({ value }) {
                navigate({ search: (oldSearch) => ({ ...oldSearch, ...value, offset: undefined }) })
            },
        })

        const columns = useMemo(
            () => [
                columnHelper.accessor("title", {
                    header: "Title",
                    cell: (info) => info.getValue(),
                }),
                columnHelper.display({
                    id: "time",
                    header: "Time",
                    cell: ({ row }) =>
                        formatDuration(row.original.end_time - row.original.start_time),
                }),
                columnHelper.accessor("album_title", {
                    header: "Artist",
                    cell: (info) => info.getValue(),
                }),
                columnHelper.accessor("artist_name", {
                    header: "Album",
                    cell: (info) => info.getValue(),
                }),
                columnHelper.accessor("genre", {
                    header: "Genre",
                    cell: (info) => info.getValue(),
                }),
                columnHelper.display({
                    id: "actions",
                    header: () => <SongSortButton order={sortBy} setOrder={handleChangeSortBy} />,
                    cell: ({ row }) => (
                        <ThemedPopUpMenu
                            button={
                                <MenuButton
                                    className="text-blue-600 p-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <DotsThreeCircleVerticalIcon
                                        weight="bold"
                                        aria-label="Actions"
                                    />
                                </MenuButton>
                            }
                            items={[
                                {
                                    key: "edit",
                                    label: (
                                        <>
                                            <PencilIcon /> Edit
                                        </>
                                    ),
                                    onClick: () => handleEdit(row.original),
                                },
                                {
                                    key: "remove",
                                    label: (
                                        <>
                                            <TrashIcon /> Remove
                                        </>
                                    ),
                                    onClick: () => handleRemove(row.original),
                                },
                            ]}
                        />
                    ),
                }),
            ],
            [sortBy, handleChangeSortBy, handleEdit, handleRemove],
        )

        const table = useReactTable({
            data: pageQuery.data?.items ? [...pageQuery.data.items] : [],
            columns,
            getCoreRowModel: getCoreRowModel(),
        })

        if (pageQuery.isError) {
            return <ThemedContentUnavailable error={pageQuery.error} onRetry={pageQuery.refetch} />
        }

        return (
            <>
                <div className="m-2 flex flex-col gap-2 cursor-default">
                    <AppForm form={facetForm}>
                        <facetForm.AppField name="query">
                            {(field) => (
                                <field.InputField
                                    className="w-full"
                                    type="search"
                                    placeholder="Filter Songs..."
                                />
                            )}
                        </facetForm.AppField>
                    </AppForm>
                    <table className="w-full">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr
                                    key={headerGroup.id}
                                    className="text-left font-semibold text-sm"
                                >
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id} className="p-2">
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {pageQuery.isSuccess &&
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="cursor-pointer bg-gray-50 odd:bg-inherit hover:bg-blue-50"
                                        draggable={true}
                                        onDragStart={(e) => handleSongDrag(e, row.original)}
                                        onClick={() =>
                                            player.replaceQueue({
                                                newQueue: new LibraryQueue(
                                                    queueShardContext,
                                                    pageQuery.data,
                                                    {
                                                        libraryId: Number(libraryId),
                                                        albumId,
                                                        artistId,
                                                        sortBy,
                                                    },
                                                ),
                                                startingItem: row.original,
                                                playNow: true,
                                            })
                                        }
                                        onKeyDown={() => {}}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-2 py-1">
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                    {pageQuery.isPending ? (
                        <ThemedContentUnavailable />
                    ) : (
                        pageQuery.isSuccess && (
                            <TableFooter
                                className="self-center"
                                singularLabel="Song"
                                pluralLabel="Songs"
                                offset={pageQuery.data.offset}
                                limit={pageQuery.data.limit}
                                total={pageQuery.data.total}
                                onChange={(offset, _limit) =>
                                    navigate({
                                        search: (oldSearch) => ({
                                            ...oldSearch,
                                            offset,
                                        }),
                                    })
                                }
                            />
                        )
                    )}
                </div>
                <Outlet />
            </>
        )
    },
})
