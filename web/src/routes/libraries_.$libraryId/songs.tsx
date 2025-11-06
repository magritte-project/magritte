import { readLibrarySongs } from "@/api/queries/libraries"
import TableFooter from "@/components/reusable/TableFooter"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import useAPIClient from "@/hooks/apiClientHook"
import usePlayer from "@/hooks/playerHook"
import useQueueShardContext from "@/hooks/queueShardContextHook"
import { Queue } from "@/playback/queue"
import { LibrarySongsQueueShard } from "@/playback/queueShards/librarySongs"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"

function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export const Route = createFileRoute("/libraries_/$libraryId/songs")({
    validateSearch: z.object({
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
            album_id: albumId,
            artist_id: artistId,
            sort_by: sortBy,
            offset,
        } = Route.useSearch()
        const navigate = useNavigate({ from: Route.fullPath })
        const apiClient = useAPIClient()
        const { data: page } = useSuspenseQuery(
            readLibrarySongs(apiClient, {
                libraryId: Number(libraryId),
                albumId,
                artistId,
                sortBy,
                offset,
            }),
        )
        const queueShardContext = useQueueShardContext()
        const player = usePlayer()
        return (
            <div className="m-2 flex flex-col gap-2 cursor-default">
                <table>
                    <thead>
                        <tr className="text-left font-semibold text-sm">
                            <th className="p-2">Title</th>
                            <th className="p-2">Time</th>
                            <th className="p-2">Artist</th>
                            <th className="p-2">Album</th>
                            <th className="p-2">Genre</th>
                        </tr>
                    </thead>
                    <tbody>
                        {page.items.map((song) => (
                            <tr
                                key={`song-${song.id}`}
                                className="cursor-pointer bg-gray-50 odd:bg-inherit hover:bg-blue-50"
                                onClick={() =>
                                    player.replaceQueue({
                                        newQueue: Queue.with(
                                            new LibrarySongsQueueShard(
                                                queueShardContext,
                                                page,
                                                {
                                                    libraryId:
                                                        Number(libraryId),
                                                    albumId,
                                                    artistId,
                                                    sortBy,
                                                },
                                            ),
                                        ),
                                        startingItem: song,
                                        playNow: true,
                                    })
                                }
                                onKeyDown={() => {}}
                            >
                                <td className="px-2 py-1">{song.title}</td>
                                <td className="px-2 py-1">
                                    {formatDuration(
                                        song.end_time - song.start_time,
                                    )}
                                </td>
                                <td className="px-2 py-1">
                                    {song.album_title}
                                </td>
                                <td className="px-2 py-1">
                                    {song.artist_name}
                                </td>
                                <td className="px-2 py-1">{song.genre}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <TableFooter
                    className="self-center"
                    singularLabel="Song"
                    pluralLabel="Songs"
                    offset={page.offset}
                    limit={page.limit}
                    total={page.total}
                    onChange={(offset, _limit) =>
                        navigate({
                            search: (oldSearch) => ({
                                ...oldSearch,
                                offset,
                            }),
                        })
                    }
                />
            </div>
        )
    },
    pendingComponent() {
        return <ThemedContentUnavailable />
    },
    errorComponent({ error, reset }) {
        return <ThemedContentUnavailable error={error} onRetry={reset} />
    },
})
