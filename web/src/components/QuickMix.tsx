import { CassetteTapeIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr"
import classNames from "classnames"
import { useCallback, useMemo, useSyncExternalStore } from "react"

import type { SongRead } from "@/api/openapi"

import ArtworkImage from "@/components/reusable/ArtworkImage"
import AsyncButton from "@/components/reusable/AsyncButton"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import usePlayer from "@/hooks/playerHook"
import usePlayingItem from "@/hooks/playingItemHook"
import { type PlayableItem } from "@/playback/item"
import ArrayQueue from "@/playback/queue/array"

export default function QuickMix() {
    const player = usePlayer()
    const playingItem = usePlayingItem()

    const queue = useMemo(() => new ArrayQueue<PlayableItem>(), [])
    const length = useSyncExternalStore(
        (onStoreChange) => {
            const subscription = queue.$events.subscribe(onStoreChange)
            return () => subscription.unsubscribe()
        },
        () => queue.length,
    )
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        if (!e.dataTransfer.types.includes("x-magritte/song")) {
            return
        }
        e.preventDefault()
        e.dataTransfer.dropEffect = "copy"
    }, [])
    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            const songJson = e.dataTransfer.getData("x-magritte/song")
            const song = JSON.parse(songJson) as SongRead
            queue.push(song)
        },
        [queue],
    )
    const handleClear = useCallback(async () => {
        await queue.clear()
    }, [queue])
    return (
        <div className="min-h-screen" onDragOver={handleDragOver} onDrop={handleDrop}>
            <header className="flex items-center gap-3 p-3">
                <span className="flex-1 font-bold text-xl">
                    {new Intl.NumberFormat().format(length)} {length === 1 ? "Item" : "Items"}
                </span>
                <ThemedSubtleButton
                    buttonComponent={AsyncButton}
                    onClick={handleClear}
                    disabled={length === 0}
                >
                    <TrashIcon aria-label="Clear" />
                </ThemedSubtleButton>
            </header>
            {length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 text-center p-3">
                    <CassetteTapeIcon weight="duotone" size="3rem" />
                    <span className="text-gray-500">
                        Drag and drop items here to create a quick mix.
                    </span>
                </div>
            ) : (
                <ol className="flex flex-col gap-1">
                    {queue.items.map((item) => (
                        <li
                            key={`quickMix.items[${item.id}]`}
                            className="px-2 py-1 text-sm cursor-pointer hover:bg-blue-50"
                            onClick={() =>
                                player.replaceQueue({
                                    newQueue: queue,
                                    startingItem: item,
                                    playNow: true,
                                })
                            }
                            onKeyDown={() => {}}
                        >
                            <div className="flex items-center gap-2">
                                <ArtworkImage
                                    className="shrink-0 w-8 aspect-square"
                                    artworks={item.artworks}
                                    itemTitle={item.title}
                                />
                                <div
                                    className={classNames("flex flex-col gap-0.5", {
                                        "text-blue-700": item.id === playingItem?.id,
                                    })}
                                >
                                    <div className="font-bold">{item?.title ?? "--"}</div>
                                    <div>
                                        {item?.album_title ?? "--"}{" "}
                                        <span className="text-gray-500">by</span>{" "}
                                        {item?.artist_name ?? "--"}
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    )
}
