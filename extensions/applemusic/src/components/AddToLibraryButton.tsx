import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react"
import { CheckIcon, CircleNotchIcon, PlusIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"

import { useBulkIngestSongsMutation } from "@/api/mutations/library"
import { readLibraries } from "@/api/queries/library"
import {
    readLibrariesContainingTags,
    readTagsMissingFromLibrary,
} from "@/api/queries/librarySources"
import {
    buttonLabelClassName,
    iconButtonClassName,
    secondaryButtonClassName,
} from "@/components/reusable/buttonStyles"
import { songResourceToExtensionTag, songResourceToIngestSong } from "@/conversions/songs"
import useExtensionHost from "@/hooks/extensionHostHook"
import useOnScreenLibraryIds from "@/hooks/onScreenLibrariesHook"
import type { SongResource } from "@/musickit/models/song"

export interface AddToLibraryButtonProps {
    readonly variant?: "icon" | "button"
    /** The songs to add, or undefined while they are still loading */
    readonly songs: readonly SongResource[] | undefined
    /** Resolves the songs to add when they have not loaded yet */
    readonly getSongs?: () => Promise<readonly SongResource[]>
}

export default function AddToLibraryButton({
    variant = "icon",
    songs,
    getSongs,
}: AddToLibraryButtonProps) {
    const extensionHost = useExtensionHost()
    const librariesQuery = useQuery(readLibraries(extensionHost))
    const ingestMutation = useBulkIngestSongsMutation()
    const onScreenLibraryIds = useOnScreenLibraryIds()

    const libraries = librariesQuery.data ?? []
    const libraryIds = libraries.map((library) => library.id)
    const tags = songs?.map(songResourceToExtensionTag) ?? []
    const containingQuery = useQuery({
        ...readLibrariesContainingTags(extensionHost, libraryIds, tags),
        enabled: libraryIds.length > 0 && tags.length > 0,
    })
    const containingLibraryIds = containingQuery.data ?? []

    // Only ask which library to add to when the answer is actually ambiguous: one
    // library, or one on screen in the host, is answer enough to just add to it
    const onScreenLibraryId = onScreenLibraryIds.length === 1 ? onScreenLibraryIds[0] : undefined
    const targetLibrary =
        libraries.length === 1
            ? libraries[0]
            : libraries.find((library) => library.id === onScreenLibraryId)

    const isInLibrary =
        targetLibrary !== undefined
            ? containingLibraryIds.includes(targetLibrary.id)
            : containingLibraryIds.length > 0

    const handleAdd = async (libraryId: number) => {
        try {
            const songsToAdd = songs ?? (await getSongs?.()) ?? []
            // Skip songs already in the library, so adding again never creates duplicates
            const missingTags = await readTagsMissingFromLibrary(
                extensionHost,
                libraryId,
                songsToAdd.map(songResourceToExtensionTag),
            )
            const missingSongs = new Map(
                songsToAdd
                    .map((song) => [songResourceToExtensionTag(song), song] as const)
                    .filter(([tag]) => missingTags.has(tag)),
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

    const label = isInLibrary ? "In Library" : "Add to Library"
    // Naming the library is more use as a tooltip than in the label, which has to stay short
    const title =
        targetLibrary !== undefined
            ? isInLibrary
                ? `In ${targetLibrary.name}`
                : `Add to ${targetLibrary.name}`
            : label
    const className = variant === "icon" ? iconButtonClassName : secondaryButtonClassName
    const content = (
        <>
            {ingestMutation.isPending ? (
                <CircleNotchIcon className="animate-spin" />
            ) : isInLibrary ? (
                <CheckIcon weight="bold" className="text-red-600" />
            ) : (
                <PlusIcon />
            )}
            {variant === "button" && <span className={buttonLabelClassName}>{label}</span>}
        </>
    )

    if (targetLibrary !== undefined) {
        return (
            <button
                type="button"
                title={title}
                className={className}
                disabled={ingestMutation.isPending || isInLibrary}
                onClick={() => handleAdd(targetLibrary.id)}
            >
                {content}
            </button>
        )
    }

    return (
        <Menu>
            <MenuButton title={title} className={className} disabled={ingestMutation.isPending}>
                {content}
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
