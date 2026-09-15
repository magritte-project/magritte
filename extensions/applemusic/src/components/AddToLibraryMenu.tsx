import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react"
import { CheckIcon, CircleNotchIcon, PlusIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"

import { useBulkIngestSongsMutation } from "@/api/mutations/library"
import { readLibraries } from "@/api/queries/library"
import {
    readLibrariesContainingSources,
    readSourcesMissingFromLibrary,
} from "@/api/queries/librarySources"
import { iconButtonClassName, secondaryButtonClassName } from "@/components/reusable/buttonStyles"
import { songResourceToIngestSong, songResourceToSourceUrl } from "@/conversions/songs"
import useExtensionHost from "@/hooks/extensionHostHook"
import type { SongResource } from "@/musickit/models/song"

export interface AddToLibraryMenuProps {
    readonly variant?: "icon" | "button"
    /** The songs to add, or undefined while they are still loading */
    readonly songs: readonly SongResource[] | undefined
    /** Resolves the songs to add when they have not loaded yet */
    readonly getSongs?: () => Promise<readonly SongResource[]>
}

export default function AddToLibraryMenu({
    variant = "icon",
    songs,
    getSongs,
}: AddToLibraryMenuProps) {
    const extensionHost = useExtensionHost()
    const librariesQuery = useQuery(readLibraries(extensionHost))
    const ingestMutation = useBulkIngestSongsMutation()

    const libraryIds = librariesQuery.data?.map((library) => library.id) ?? []
    const urls = songs?.map(songResourceToSourceUrl) ?? []
    const containingQuery = useQuery({
        ...readLibrariesContainingSources(extensionHost, libraryIds, urls),
        enabled: libraryIds.length > 0 && urls.length > 0,
    })
    const containingLibraryIds = containingQuery.data ?? []
    const isInLibrary = containingLibraryIds.length > 0

    const handleAdd = async (libraryId: number) => {
        try {
            const songsToAdd = songs ?? (await getSongs?.()) ?? []
            // Skip songs already in the library, so adding again never creates duplicates
            const missingUrls = await readSourcesMissingFromLibrary(
                extensionHost,
                libraryId,
                songsToAdd.map(songResourceToSourceUrl),
            )
            const missingSongs = new Map(
                songsToAdd
                    .map((song) => [songResourceToSourceUrl(song), song] as const)
                    .filter(([url]) => missingUrls.has(url)),
            )
            if (missingSongs.size > 0) {
                await ingestMutation.mutateAsync({
                    libraryId,
                    songs: [...missingSongs.values()].map(songResourceToIngestSong),
                })
            }
        } catch (error) {
            console.error("*** Could not add songs to library", error)
        }
    }

    const title = isInLibrary ? "In Library" : "Add to Library"
    return (
        <Menu>
            <MenuButton
                title={title}
                className={variant === "icon" ? iconButtonClassName : secondaryButtonClassName}
                disabled={ingestMutation.isPending}
            >
                {ingestMutation.isPending ? (
                    <CircleNotchIcon className="animate-spin" />
                ) : isInLibrary ? (
                    <CheckIcon weight="bold" className="text-red-600" />
                ) : (
                    <PlusIcon />
                )}
                {variant === "button" && title}
            </MenuButton>
            <MenuItems
                anchor="bottom end"
                className="bg-white rounded-md shadow-sm text-sm flex flex-col z-100"
                onClick={(e) => e.stopPropagation()}
            >
                {librariesQuery.isSuccess ? (
                    librariesQuery.data.map((library, index) => {
                        const isInThisLibrary = containingLibraryIds.includes(library.id)
                        return (
                            <MenuItem
                                key={`library[${library.id}@${index}]`}
                                disabled={isInThisLibrary}
                            >
                                <button
                                    type="button"
                                    className="min-w-32 text-left p-2 flex items-center gap-2 hover:bg-blue-600 hover:text-white data-focus:bg-blue-600 data-focus:text-white disabled:hover:bg-inherit disabled:hover:text-inherit disabled:opacity-70"
                                    disabled={isInThisLibrary}
                                    onClick={() => handleAdd(library.id)}
                                >
                                    {isInThisLibrary ? (
                                        <>
                                            <CheckIcon /> In {library.name}
                                        </>
                                    ) : (
                                        <>Add to {library.name}</>
                                    )}
                                </button>
                            </MenuItem>
                        )
                    })
                ) : (
                    <div className="min-w-32 p-2 text-gray-500">
                        {librariesQuery.isError ? "Could not load libraries" : "Loading..."}
                    </div>
                )}
            </MenuItems>
        </Menu>
    )
}
