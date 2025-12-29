import useServiceRegistry from "@/hooks/serviceRegistryHook"
import { useMemo, useState } from "react"
import { useDebounce } from "@uidotdev/usehooks"
import useAPIClient from "@/hooks/apiClientHook"
import { useQuery } from "@tanstack/react-query"
import { searchServiceSongs } from "@/api/queries/services"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import ThemedInput from "@/components/theme/ThemedInput"
import usePlayer from "@/hooks/playerHook"
import type { SongRead } from "@/api/openapi"
import { Queue } from "@/playback/queue"
import { ArrayQueueShard } from "@/playback/queueShards/array"
import AppCommandsProvider from "@/contexts/providers/AppCommandsProvider"
import type { JsonStructure } from "react-cmdk"
import { UserIcon } from "@phosphor-icons/react"

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
        searchServiceSongs(apiClient, selectedService, currentQuery),
    )

    const serviceItems = useMemo<JsonStructure>(() => {
        return [
            {
                id: "applemusic",
                heading: "Apple Music",
                items: [
                    {
                        id: "applemusic.authorize",
                        icon: UserIcon,
                        children: "Authorize",
                        onClick: () => {
                            MusicKit.getInstance().authorize()
                        },
                    },
                ],
            },
        ]
    }, [])

    return (
        <AppCommandsProvider items={serviceItems}>
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
                        searchQuery.data.items.map((item) => (
                            <li
                                key={`${item.id}`}
                                className="flex items-center gap-2"
                                onKeyDown={() => {}}
                                onClick={() => {
                                    const song: SongRead = {
                                        id: Number(item.id),
                                        start_time: 0,
                                        end_time: 0,
                                        sources: [
                                            {
                                                id: 0,
                                                url: item.source_url,
                                                mime_type: null,
                                                is_invalid: false,
                                            },
                                        ],
                                        title: item.title,
                                        artist_name: item.artist_name,
                                        album_title: item.album_title,
                                    }
                                    console.log(item)
                                    player.replaceQueue({
                                        newQueue: Queue.with(
                                            new ArrayQueueShard(item.id, [
                                                song,
                                            ]),
                                        ),
                                        playNow: true,
                                    })
                                }}
                            >
                                <ArtworkImage
                                    className="h-8 aspect-square shrink-0"
                                    itemTitle={item.title}
                                />
                                <div className="flex flex-col">
                                    <div className="font-bold text-sm">
                                        {item.title ?? "--"}
                                    </div>
                                    <div className="text-gray-700 text-xs">
                                        {item.album_title ?? "--"} by{" "}
                                        {item.artist_name ?? "--"}
                                    </div>
                                </div>
                            </li>
                        ))}
                </ol>
            </div>
        </AppCommandsProvider>
    )
}
