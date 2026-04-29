import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import z4 from "zod"

import { readLibraries } from "@/api/queries/library"
import { searchSongs } from "@/api/queries/search"
import SearchResultLabel from "@/components/SearchResultLabel"
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
            queryClient.ensureQueryData(readLibraries(extensionHost)),
            queryClient.ensureQueryData(searchSongs(musicKit, query)),
        ])
    },
    component: function SearchSongsComponent() {
        const { query } = Route.useSearch()

        // const extensionHost = useExtensionHost()
        // const { data: libraries } = useSuspenseQuery(readLibraries(extensionHost))

        const musicKit = useMusicKit()
        const { data: songs } = useSuspenseQuery(searchSongs(musicKit, query))

        return (
            <div>
                <ol>
                    {songs.map((song, index) => (
                        <li key={`songs[${song.id}@${index}]`}>
                            <SearchResultLabel
                                artwork={song.attributes?.artwork}
                                title={song.attributes?.name}
                                creator={song.attributes?.artistName}
                                collection={song.attributes?.albumName}
                            />
                        </li>
                    ))}
                </ol>
            </div>
        )
    },
})
