import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react"
import { LibraryInput, type CatalogSong, type PlayableItem } from "@magritte/sdk"
import {
    ArrowLeftIcon,
    CheckIcon,
    CircleNotchIcon,
    PlayIcon,
    PlusIcon,
} from "@phosphor-icons/react/dist/ssr"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import classNames from "classnames"
import { useEffect, useId, useRef, useState } from "react"

import { libraryAlbums, libraryArtists, librarySongs } from "@/api/keys/libraries"
import { readLibraries } from "@/api/queries/libraries"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import useAPI from "@/hooks/apiHook"
import useCommandInputs from "@/hooks/commandInputsHook"
import useExtensionRuntime from "@/hooks/extensionRuntimeHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"
import usePlayer from "@/hooks/playerHook"
import ArrayQueue from "@/playback/queue/array"
import { getErrorMessage } from "@/utilities/errors"

/** How long to wait after typing stops before searching, in milliseconds */
const searchDebounceDelay = 200

interface Library {
    readonly id: number
    readonly name: string
}

function catalogSongToPlayableItem({ id, song }: CatalogSong): PlayableItem {
    return { id, ...song }
}

const iconButtonClassName =
    "shrink-0 rounded-md p-1.5 hover:bg-black/10 disabled:opacity-disabled focus-visible:outline-2"

export interface CommandPaletteCatalogSearchProps {
    readonly extensionId: string
    /** The term to begin searching for immediately */
    readonly initialTerm?: string
    readonly onBack: () => void
    readonly onClose: () => void
}

export default function CommandPaletteCatalogSearch({
    extensionId,
    initialTerm = "",
    onBack,
    onClose,
}: CommandPaletteCatalogSearchProps) {
    const api = useAPI()
    const inputs = useCommandInputs()
    const player = usePlayer()
    const notificationCenter = useNotificationCenter()
    const queryClient = useQueryClient()
    const extension = useExtensionRuntime().getRunning(extensionId)
    const extensionName = extension?.manifest.name ?? extensionId
    const listboxId = useId()

    const [term, setTerm] = useState(initialTerm)
    const [debouncedTerm, setDebouncedTerm] = useState(initialTerm.trim())
    const [activeIndex, setActiveIndex] = useState(0)
    const [addedKeys, setAddedKeys] = useState<ReadonlySet<string>>(() => new Set())
    const rowRefs = useRef<(HTMLLIElement | null)[]>([])

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedTerm(term.trim()), searchDebounceDelay)
        return () => clearTimeout(timeout)
    }, [term])

    const searchQuery = useQuery({
        queryKey: ["catalogSearch", extensionId, debouncedTerm],
        queryFn: async () => {
            if (extension === null) {
                throw new Error(`${extensionName} is not running`)
            }
            const searcher = await extension.catalogSearcher()
            return await searcher.searchCatalog({ term: debouncedTerm })
        },
        enabled: debouncedTerm.length > 0,
        placeholderData: keepPreviousData,
        staleTime: 5 * 60_000,
    })
    const librariesQuery = useQuery(readLibraries(api))

    const results = debouncedTerm ? (searchQuery.data?.songs ?? []) : []
    const activeResultIndex = Math.max(0, Math.min(activeIndex, results.length - 1))

    useEffect(() => {
        rowRefs.current[activeResultIndex]?.scrollIntoView({ block: "nearest" })
    }, [activeResultIndex])

    const libraries: readonly Library[] = librariesQuery.data ?? []
    const [currentLibraryInput] = inputs.allOf(LibraryInput)
    const defaultLibrary =
        libraries.find((library) => library.id === currentLibraryInput?.id) ?? libraries.at(0)

    const addMutation = useMutation({
        mutationFn: async ({ result, library }: { result: CatalogSong; library: Library }) => {
            await api.client.ingestSongs(library.id, { songs: [result.song] })
        },
        onSuccess: async (_, { result, library }) => {
            setAddedKeys((keys) => new Set(keys).add(`${library.id}:${result.id}`))
            notificationCenter.showToast({
                message: `Added “${result.song.title}” to ${library.name}`,
                type: "info",
            })
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: libraryArtists(library.id),
                    exact: false,
                }),
                queryClient.invalidateQueries({
                    queryKey: libraryAlbums(library.id),
                    exact: false,
                }),
                queryClient.invalidateQueries({ queryKey: librarySongs(library.id), exact: false }),
            ])
        },
        onError: (error) => {
            notificationCenter.showToast({
                message: `Could not add song to library: ${getErrorMessage(error)}`,
                type: "error",
            })
        },
    })

    const play = async (result: CatalogSong) => {
        onClose()
        try {
            // Without a starting item, the player looks for the item following the one
            // currently playing, which isn't in the new queue, and plays nothing
            const item = catalogSongToPlayableItem(result)
            await player.replaceQueue({
                newQueue: new ArrayQueue([item]),
                startingItem: item,
                playNow: true,
            })
        } catch (error) {
            notificationCenter.showToast({
                message: `Could not play song: ${getErrorMessage(error)}`,
                type: "error",
            })
        }
    }

    const add = (result: CatalogSong, library: Library | undefined) => {
        if (library !== undefined && !addMutation.isPending) {
            addMutation.mutate({ result, library })
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault()
                setActiveIndex(Math.min(activeResultIndex + 1, results.length - 1))
                break
            case "ArrowUp":
                e.preventDefault()
                setActiveIndex(Math.max(activeResultIndex - 1, 0))
                break
            case "Enter": {
                const result = results.at(activeResultIndex)
                if (result === undefined) {
                    break
                }
                e.preventDefault()
                if (e.metaKey || e.ctrlKey) {
                    add(result, defaultLibrary)
                } else {
                    play(result)
                }
                break
            }
            case "Escape":
                e.preventDefault()
                onBack()
                break
            case "Backspace":
                if (term === "") {
                    e.preventDefault()
                    onBack()
                }
                break
            default:
                break
        }
    }

    const renderResults = () => {
        if (!debouncedTerm) {
            return <PaletteMessage>Search for songs on {extensionName}</PaletteMessage>
        }
        if (searchQuery.isError) {
            return <PaletteMessage>{getErrorMessage(searchQuery.error)}</PaletteMessage>
        }
        if (searchQuery.isPending) {
            return <PaletteMessage>Searching…</PaletteMessage>
        }
        if (results.length === 0) {
            return <PaletteMessage>No results for “{debouncedTerm}”</PaletteMessage>
        }
        return results.map((result, index) => {
            const isActive = index === activeResultIndex
            const isAdding = addMutation.isPending && addMutation.variables?.result.id === result.id
            return (
                <li
                    key={`${result.id}@${index}`}
                    ref={(element) => {
                        rowRefs.current[index] = element
                    }}
                    id={`${listboxId}-${index}`}
                    role="option"
                    aria-selected={isActive}
                    className={classNames(
                        "flex items-center gap-3 px-4 py-2 text-sm cursor-default not-last:border-b border-separator",
                        isActive && "bg-key text-on-key",
                    )}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => play(result)}
                >
                    <ArtworkImage
                        className="h-9 aspect-square shrink-0"
                        artworks={result.song.artworks}
                        itemTitle={result.song.title}
                    />
                    <div className="flex min-w-0 grow flex-col">
                        <span className="truncate">{result.song.title}</span>
                        <span
                            className={classNames(
                                "truncate text-xs",
                                isActive ? "opacity-80" : "text-on-secondary",
                            )}
                        >
                            {[result.song.artist_name, result.song.album_title]
                                .filter(Boolean)
                                .join(" · ")}
                        </span>
                    </div>
                    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            tabIndex={-1}
                            title="Play Now"
                            className={iconButtonClassName}
                            onClick={() => play(result)}
                        >
                            <PlayIcon size={16} weight="fill" />
                        </button>
                        <AddToLibraryButton
                            libraries={libraries}
                            isAdding={isAdding}
                            isAdded={(library) => addedKeys.has(`${library.id}:${result.id}`)}
                            onAdd={(library) => add(result, library)}
                        />
                    </div>
                </li>
            )
        })
    }

    return (
        <div className="overflow-hidden rounded-xl border border-outline bg-primary shadow-2xl">
            <div className="flex items-center gap-2 border-b border-outline px-outside">
                <button
                    type="button"
                    title="Back to Commands"
                    className="-ml-1.5 shrink-0 rounded-md p-1 text-placeholder hover:bg-black/10"
                    onClick={onBack}
                >
                    <ArrowLeftIcon size={16} />
                </button>
                <input
                    className="w-full bg-transparent py-between text-sm outline-none"
                    autoFocus
                    role="combobox"
                    aria-controls={listboxId}
                    aria-expanded={results.length > 0}
                    aria-activedescendant={
                        results.length > 0 ? `${listboxId}-${activeResultIndex}` : undefined
                    }
                    placeholder={`Search ${extensionName}...`}
                    value={term}
                    onChange={(e) => {
                        setTerm(e.currentTarget.value)
                        setActiveIndex(0)
                    }}
                    onKeyDown={handleKeyDown}
                />
                {searchQuery.isFetching && (
                    <CircleNotchIcon className="shrink-0 animate-spin text-placeholder" size={16} />
                )}
            </div>
            <ul id={listboxId} role="listbox" className="max-h-80 overflow-y-auto">
                {renderResults()}
            </ul>
            <div className="flex justify-end gap-4 border-t border-outline px-4 py-1.5 text-xs text-on-secondary">
                <span>↵ Play Now</span>
                {defaultLibrary !== undefined && <span>⌘↵ Add to {defaultLibrary.name}</span>}
                <span>esc Back</span>
            </div>
        </div>
    )
}

function PaletteMessage({ children }: { readonly children: React.ReactNode }) {
    return <li className="px-4 py-8 text-center text-sm text-on-secondary">{children}</li>
}

interface AddToLibraryButtonProps {
    readonly libraries: readonly Library[]
    readonly isAdding: boolean
    readonly isAdded: (library: Library) => boolean
    readonly onAdd: (library: Library) => void
}

function AddToLibraryButton({ libraries, isAdding, isAdded, onAdd }: AddToLibraryButtonProps) {
    const icon = isAdding ? (
        <CircleNotchIcon className="animate-spin" size={16} />
    ) : libraries.length > 0 && libraries.every(isAdded) ? (
        <CheckIcon size={16} />
    ) : (
        <PlusIcon size={16} />
    )

    if (libraries.length <= 1) {
        const [library] = libraries
        return (
            <button
                type="button"
                tabIndex={-1}
                title={library ? `Add to ${library.name}` : "Add to Library"}
                className={iconButtonClassName}
                disabled={library === undefined || isAdding}
                onClick={() => library && onAdd(library)}
            >
                {icon}
            </button>
        )
    }

    return (
        <Menu>
            <MenuButton
                tabIndex={-1}
                title="Add to Library"
                className={iconButtonClassName}
                disabled={isAdding}
            >
                {icon}
            </MenuButton>
            <MenuItems
                anchor="bottom end"
                className="z-100 flex min-w-40 flex-col overflow-hidden rounded-md border border-outline bg-primary text-sm shadow-lg"
            >
                {libraries.map((library) => (
                    <MenuItem key={library.id}>
                        <button
                            type="button"
                            className="flex items-center justify-between gap-2 px-3 py-2 text-left data-focus:bg-key data-focus:text-on-key"
                            onClick={() => onAdd(library)}
                        >
                            Add to {library.name}
                            {isAdded(library) && <CheckIcon size={14} />}
                        </button>
                    </MenuItem>
                ))}
            </MenuItems>
        </Menu>
    )
}
