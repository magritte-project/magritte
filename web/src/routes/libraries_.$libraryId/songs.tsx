import { useReadLibrarySongsQuery } from "@/api/hooks/libraries"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import usePlayer from "@/hooks/playerHook"
import { Queue, StaticQueueShard } from "@/playback/queue"
import { createFileRoute } from "@tanstack/react-router"
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
        offset: z.number().optional(),
    }),
    component: function LibrarySongsComponent() {
        const { libraryId } = Route.useParams()
        const { album_id, artist_id, offset } = Route.useSearch()
        const { data: page } = useReadLibrarySongsQuery(
            Number(libraryId),
            album_id,
            artist_id,
            offset,
        )
        const player = usePlayer()
        return (
            <div className="m-2 flex flex-col gap-2">
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
                                className="bg-gray-50 odd:bg-inherit"
                                onClick={() =>
                                    player.replaceQueue({
                                        newQueue: new Queue([
                                            new StaticQueueShard(
                                                `/libraries/${libraryId}/songs`,
                                                page.items,
                                            ),
                                        ]),
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
                <footer className="text-sm text-gray-700 self-center">
                    {new Intl.NumberFormat().format(page.total)} Songs
                </footer>
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
