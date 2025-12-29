import useServiceRegistry from "@/hooks/serviceRegistryHook"
import { useState } from "react"
import { useDebounce } from "@uidotdev/usehooks"
import useAPIClient from "@/hooks/apiClientHook"
import { useQuery } from "@tanstack/react-query"
import { searchService } from "@/api/queries/services"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import ThemedInput from "@/components/theme/ThemedInput"
import usePlayer from "@/hooks/playerHook"
import type { SongRead } from "@/api/openapi"
import { Queue } from "@/playback/queue"
import { ArrayQueueShard } from "@/playback/queueShards/array"

export default function Search() {
    const apiClient = useAPIClient()
    const serviceRegistry = useServiceRegistry()
    const player = usePlayer()

    const [selectedService, setSelectedService] = useState<string | undefined>(
        serviceRegistry.availableServices[0]?.name,
    )
    const [query, setQuery] = useState("")
    const currentQuery = useDebounce(query, 500)
    const searchQuery = useQuery(
        searchService(apiClient, selectedService, currentQuery),
    )

    return (
        <div className="flex flex-col gap-3 p-3">
            <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.currentTarget.value)}
            >
                {serviceRegistry.availableServices.map((service) => (
                    <option key={service.name} value={service.name}>
                        {service.display_name}
                    </option>
                ))}
            </select>
            <ThemedInput
                type="search"
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                placeholder="Search…"
            />
            <ol className="flex flex-col gap-2">
                {searchQuery.isSuccess &&
                    searchQuery.data.results.map((result) => (
                        <li
                            key={`${result.kind}.${result.id}`}
                            className="flex items-center gap-2"
                            onKeyDown={() => {}}
                            onClick={() => {
                                const song: SongRead = {
                                    id: Number(result.id),
                                    start_time: 0,
                                    end_time: 0,
                                    sources: [
                                        {
                                            id: 0,
                                            url: `applemusic:///${result.kind}/${result.id}`,
                                            mime_type: null,
                                            is_invalid: false,
                                        },
                                    ],
                                    title: result.title,
                                    artist_name: result.artist_name,
                                    album_title: result.album_title,
                                }
                                console.log(result)
                                player.replaceQueue({
                                    newQueue: Queue.with(
                                        new ArrayQueueShard(result.id, [song]),
                                    ),
                                    playNow: true,
                                })
                            }}
                        >
                            <ArtworkImage
                                className="h-8 aspect-square shrink-0"
                                itemTitle={result.title}
                            />
                            <div className="flex flex-col">
                                <div className="font-bold text-sm">
                                    {result.title ?? "--"}
                                </div>
                                <div className="text-gray-700 text-xs">
                                    {result.album_title ?? "--"} by{" "}
                                    {result.artist_name ?? "--"}
                                </div>
                            </div>
                        </li>
                    ))}
            </ol>
        </div>
    )
}
