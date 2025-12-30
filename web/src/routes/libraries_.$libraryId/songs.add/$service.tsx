import { searchServiceSongs } from "@/api/queries/services"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import AsyncButton from "@/components/reusable/AsyncButton"
import ThemedInput from "@/components/theme/ThemedInput"
import useAddServiceSong from "@/hooks/addServiceSongHook"
import useAPIClient from "@/hooks/apiClientHook"
import { PlusIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useDebounce } from "@uidotdev/usehooks"
import { useState } from "react"

export const Route = createFileRoute(
    "/libraries_/$libraryId/songs/add/$service",
)({
    component: function ServiceComponent() {
        const { libraryId, service } = Route.useParams()
        const apiClient = useAPIClient()

        const [query, setQuery] = useState("")
        const currentQuery = useDebounce(query, 500)
        const searchQuery = useQuery(
            searchServiceSongs(apiClient, service, currentQuery),
        )

        const { addServiceSong } = useAddServiceSong({
            libraryId: Number(libraryId),
        })

        return (
            <div className="flex flex-col gap-3 p-3">
                <ThemedInput
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    placeholder="Search…"
                />
                <ol className="flex flex-col gap-2">
                    {searchQuery.isSuccess &&
                        searchQuery.data.items.map((song) => (
                            <li
                                key={`${song.id}`}
                                className="flex items-center gap-2"
                            >
                                <ArtworkImage
                                    className="h-8 aspect-square shrink-0"
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
                                <AsyncButton
                                    type="button"
                                    className="cursor-pointer hover:bg-blue-100 active:bg-blue-300 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-full p-1"
                                    onClick={() => addServiceSong(song)}
                                >
                                    <PlusIcon aria-label="Add" />
                                </AsyncButton>
                            </li>
                        ))}
                </ol>
            </div>
        )
    },
})
