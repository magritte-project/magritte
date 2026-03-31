import { MinusIcon, PlusIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useDebounce } from "@uidotdev/usehooks"
import { useState } from "react"

import type { StreamingMusicServiceSongsRead } from "@/services/base"

import ArtworkImage from "@/components/reusable/ArtworkImage"
import AsyncButton from "@/components/reusable/AsyncButton"
import ThemedInput from "@/components/theme/ThemedInput"
import useIngestSongs from "@/hooks/ingestSongsHook"
import usePlayer from "@/hooks/playerHook"
import useServices from "@/hooks/servicesHook"
import ArrayQueue from "@/playback/queue/array"

export const Route = createFileRoute("/libraries_/$libraryId/songs/add/")({
    component: function ServiceComponent() {
        const player = usePlayer()
        const streamingServices = useServices("songSearch")

        const [query, setQuery] = useState("")
        const currentQuery = useDebounce(query, 500)
        const searchQuery = useQuery({
            queryKey: ["searchStreamingMusic", currentQuery],
            queryFn: async () => {
                const results: [string, StreamingMusicServiceSongsRead][] = []
                if (currentQuery) {
                    for (const service of streamingServices) {
                        const result = await service.searchSongs(currentQuery)
                        results.push([service.name, result])
                    }
                }
                return results
            },
        })

        const { isAdded, add, remove } = useIngestSongs()

        return (
            <div className="flex flex-col gap-3 p-3">
                <ThemedInput
                    type="search"
                    className="rounded-full! px-4"
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    placeholder="Search…"
                />
                <div className="h-[50vh]">
                    {searchQuery.isSuccess &&
                        searchQuery.data.map(([name, results]) => (
                            <section key={name}>
                                <header className="font-bold text-lg pb-3">{name}</header>
                                <ol className="flex flex-col gap-2">
                                    {results.items.map((song) => (
                                        <li
                                            key={`${name}-${song.id}`}
                                            className="flex items-center gap-2"
                                        >
                                            <AsyncButton
                                                type="button"
                                                className="flex-1 flex items-center gap-2 text-start"
                                                onClick={() =>
                                                    player.replaceQueue({
                                                        newQueue: ArrayQueue.of(song),
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
                                            </AsyncButton>
                                            <button
                                                type="button"
                                                className="cursor-pointer hover:bg-blue-100 active:bg-blue-300 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-full p-1"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (!isAdded(song)) {
                                                        add(song)
                                                    } else {
                                                        remove(song)
                                                    }
                                                }}
                                            >
                                                {isAdded(song) ? (
                                                    <MinusIcon aria-label="Remove" />
                                                ) : (
                                                    <PlusIcon aria-label="Add" />
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        ))}
                </div>
            </div>
        )
    },
})
