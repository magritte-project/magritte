import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import z4 from "zod"

import { readLibraries } from "@/api/queries/library"
import { searchSongs } from "@/api/queries/search"
import SearchResultLabel from "@/components/SearchResultLabel"
import { songResourceToPlayableItem } from "@/conversions/songs"
import useExtensionHost from "@/hooks/extensionHostHook"
import useMusicKit from "@/hooks/musicKitHook"

export const Route = createFileRoute("/search/songs")({
    validateSearch: z4.object({
        query: z4.string(),
    }),
    loaderDeps: ({ search }) => ({
        search,
    }),
    loader: async ({
        deps: {
            search: { query },
        },
        context: { queryClient, extensionHost, musicKit },
    }) => {
        await Promise.all([
            queryClient.ensureQueryData(searchSongs(musicKit, query)),
            queryClient.ensureQueryData(readLibraries(extensionHost)),
        ])
    },
    component: function SearchSongsComponent() {
        const { query } = Route.useSearch()

        const extensionHost = useExtensionHost()
        const { data: libraries } = useSuspenseQuery(readLibraries(extensionHost))

        const musicKit = useMusicKit()
        const { data: songs } = useSuspenseQuery(searchSongs(musicKit, query))

        return (
            <div>
                <ol className="flex flex-col py-3">
                    {songs.map((song, index) => (
                        <li
                            key={`songs[${song.id}@${index}]`}
                            className="w-full hover:bg-black/10 flex items-center gap-2"
                        >
                            <button
                                type="button"
                                className="flex-1 px-3 py-2 text-left"
                                onClick={async () => {
                                    const player = await extensionHost.player()
                                    player.replaceQueue({
                                        newQueueItems: [songResourceToPlayableItem(song)],
                                        playNow: true,
                                    })
                                }}
                            >
                                <SearchResultLabel
                                    artwork={song.attributes?.artwork}
                                    title={song.attributes?.name}
                                    creator={song.attributes?.artistName}
                                    collection={song.attributes?.albumName}
                                />
                            </button>
                        </li>
                    ))}
                </ol>
            </div>
        )
    },
})
