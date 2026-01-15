import { PlusIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useDebounce } from "@uidotdev/usehooks"
import { useMemo, useState } from "react"

import type { StreamingMusicServiceSongsRead } from "@/services/types"

import ArtworkImage from "@/components/reusable/ArtworkImage"
import AsyncButton from "@/components/reusable/AsyncButton"
import ThemedInput from "@/components/theme/ThemedInput"
import useIngestSongs from "@/hooks/ingestSongsHook"
import usePlayer from "@/hooks/playerHook"
import { Queue } from "@/playback/queue"
import { ArrayQueueShard } from "@/playback/queueShards/array"
import { getServicesOfType } from "@/services/initialization"

export const Route = createFileRoute("/libraries_/$libraryId/songs/add/")({
    component: function ServiceComponent() {
        const player = usePlayer()
        const streamingServices = useMemo(() => getServicesOfType("streamingMusic"), [])

        const [query, setQuery] = useState("")
        const currentQuery = useDebounce(query, 500)
        const searchQuery = useQuery({
            queryKey: ["searchStreamingMusic", currentQuery],
            queryFn: async () => {
                const results: [string, StreamingMusicServiceSongsRead][] = []
                if (currentQuery) {
                    for (const [name, service] of streamingServices) {
                        const result = await service.searchSongs(currentQuery)
                        results.push([name, result])
                    }
                }
                return results
            },
        })

        const { isAdded, add } = useIngestSongs()

        return (
            <div className="flex flex-col gap-3 p-3">
                <ThemedInput
                    type="search"
                    className="rounded-full! px-4"
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    placeholder="Search…"
                />
                <ol className="flex flex-col gap-2 h-[50vh]">
                    {searchQuery.isSuccess &&
                        searchQuery.data.map(([name, results]) =>
                            results.items.map((song) => (
                                <li key={`${name}-${song.id}`}>
                                    <AsyncButton
                                        type="button"
                                        className="flex items-center gap-2 text-start w-full"
                                        onClick={() =>
                                            player.replaceQueue({
                                                newQueue: Queue.with(ArrayQueueShard.of(song)),
                                                startingItem: song,
                                                playNow: true,
                                            })
                                        }
                                    >
                                        <ArtworkImage
                                            className="h-8 aspect-square shrink-0"
                                            artworks={song.artworks}
                                            itemTitle={song.title}
                                        />
                                        <div className="flex-1 flex flex-col">
                                            <div className="font-bold text-sm">
                                                {song.title ?? "--"}
                                            </div>
                                            <div className="text-gray-700 text-xs">
                                                {song.album_title ?? "--"} by{" "}
                                                {song.artist_name ?? "--"}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="cursor-pointer hover:bg-blue-100 active:bg-blue-300 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-full p-1"
                                            onClick={async (e) => {
                                                e.stopPropagation()
                                                add([song])
                                            }}
                                            disabled={isAdded(song)}
                                        >
                                            <PlusIcon aria-label="Add" />
                                        </button>
                                    </AsyncButton>
                                </li>
                            )),
                        )}
                </ol>
            </div>
        )
    },
})
