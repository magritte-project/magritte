import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react"
import { PlusIcon } from "@phosphor-icons/react"
import { useForm } from "@tanstack/react-form"
import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import z4 from "zod"

import { useBulkIngestSongsMutation } from "@/api/mutations/library"
import { readLibraries } from "@/api/queries/library"
import { searchSongs } from "@/api/queries/search"
import SearchResultLabel from "@/components/SearchResultLabel"
import {
    songResourceToLibraryIngestableSong,
    songResourceToPlayableItem,
} from "@/conversions/songs"
import useExtensionHost from "@/hooks/extensionHostHook"
import useMusicKit from "@/hooks/musicKitHook"

export const Route = createFileRoute("/search/songs")({
    validateSearch: z4.object({
        query: z4.string().optional(),
    }),
    loaderDeps: ({ search }) => ({
        search,
    }),
    loader: async ({ context: { queryClient, extensionHost } }) => {
        await queryClient.ensureQueryData(readLibraries(extensionHost))
    },
    component: function SearchSongsComponent() {
        const { query = "" } = Route.useSearch()
        const navigate = Route.useNavigate()

        const extensionHost = useExtensionHost()
        const { data: libraries } = useSuspenseQuery(readLibraries(extensionHost))

        const ingestMutation = useBulkIngestSongsMutation()

        const musicKit = useMusicKit()
        const songsQuery = useQuery(searchSongs(musicKit, query))

        console.log(query, songsQuery)

        const form = useForm({
            defaultValues: {
                query,
            },
            onSubmit: ({ value }) => {
                navigate({
                    search: (oldSearch) => ({ ...oldSearch, ...value }),
                })
            },
        })

        return (
            <div>
                <form
                    className="flex flex-col gap-3 px-3"
                    onSubmit={(e) => {
                        e.preventDefault()
                        e.stopPropagation()

                        form.handleSubmit()
                    }}
                >
                    <form.Field name="query">
                        {(field) => (
                            <input
                                type="search"
                                className="bg-white rounded-lg p-2 min-w-0 w-auto text-gray-950 placeholder:text-black/40 border border-gray-300 focus:border-blue-500 outline-0"
                                placeholder="Search songs..."
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.currentTarget.value)}
                                onBlur={field.handleBlur}
                            />
                        )}
                    </form.Field>
                </form>
                <ol className="flex flex-col py-3">
                    {songsQuery.isSuccess &&
                        songsQuery.data.map((song, index) => (
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
                                <Menu>
                                    <MenuButton title="Add to Library">
                                        <PlusIcon />
                                    </MenuButton>
                                    <MenuItems
                                        anchor="bottom"
                                        className="bg-white rounded-md shadow-sm text-sm flex flex-col z-100"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {libraries.map((library, index) => (
                                            <MenuItem key={`library[${library.id}@${index}]`}>
                                                <button
                                                    type="button"
                                                    className="min-w-32 text-left p-2 flex items-center gap-2 hover:bg-blue-600 hover:text-white disabled:hover:bg-inherit disabled:hover:text-inherit disabled:opacity-70"
                                                    onClick={() => {
                                                        ingestMutation.mutate({
                                                            libraryId: library.id,
                                                            songs: [
                                                                songResourceToLibraryIngestableSong(
                                                                    song,
                                                                ),
                                                            ],
                                                        })
                                                    }}
                                                >
                                                    Add to {library.name}
                                                </button>
                                            </MenuItem>
                                        ))}
                                    </MenuItems>
                                </Menu>
                            </li>
                        ))}
                </ol>
            </div>
        )
    },
})
