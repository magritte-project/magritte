import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react"
import { PlusIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { useDebounce } from "@uidotdev/usehooks"
import { useState } from "react"

import { useBulkIngestSongsMutation } from "@/api/mutations/library"
import { readLibraries } from "@/api/queries/library"
import { searchSongs } from "@/api/queries/search"
import SearchResultLabel from "@/components/SearchResultLabel"
import ContentUnavailable from "@/components/structure/ContentUnavailable"
import { songResourceToIngestSong, songResourceToPlayableItem } from "@/conversions/songs"
import useExtensionHost from "@/hooks/extensionHostHook"
import useMusicKit from "@/hooks/musicKitHook"

export default function Search() {
    const [query, setQuery] = useState("")
    const debouncedQuery = useDebounce(query, 100)

    const extensionHost = useExtensionHost()
    const librariesQuery = useQuery(readLibraries(extensionHost))

    const ingestMutation = useBulkIngestSongsMutation()

    const musicKit = useMusicKit()
    const songsQuery = useQuery(searchSongs(musicKit, debouncedQuery))

    if (librariesQuery.isPending) {
        return <ContentUnavailable />
    }

    if (librariesQuery.isError || songsQuery.isError) {
        return <ContentUnavailable error={librariesQuery.error || songsQuery.error} />
    }

    return (
        <div>
            <div className="flex flex-col gap-3 px-3">
                <input
                    type="search"
                    className="bg-white rounded-lg p-2 min-w-0 w-auto text-gray-950 placeholder:text-black/40 border border-gray-300 focus:border-blue-500 outline-0"
                    placeholder="Search songs..."
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                />
            </div>
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
                                    {librariesQuery.data.map((library, index) => (
                                        <MenuItem key={`library[${library.id}@${index}]`}>
                                            <button
                                                type="button"
                                                className="min-w-32 text-left p-2 flex items-center gap-2 hover:bg-blue-600 hover:text-white disabled:hover:bg-inherit disabled:hover:text-inherit disabled:opacity-70"
                                                onClick={() => {
                                                    ingestMutation.mutate({
                                                        libraryId: library.id,
                                                        songs: [songResourceToIngestSong(song)],
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
}
