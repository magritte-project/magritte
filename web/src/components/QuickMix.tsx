import { type PlayableItem } from "@magritte/sdk"
import { CassetteTapeIcon, TrashIcon } from "@phosphor-icons/react"
import classNames from "classnames"
import { useCallback, useEffect, useMemo, useState } from "react"

import type { SongRead } from "@/api/openapi"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import AsyncButton from "@/components/reusable/AsyncButton"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import usePlayer from "@/hooks/playerHook"
import usePlayingItem from "@/hooks/playingItemHook"
import ArrayQueue from "@/playback/queue/array"

export default function QuickMix() {
    const player = usePlayer()
    const playingItem = usePlayingItem()

    const queue = useMemo(() => new ArrayQueue<PlayableItem>(), [])
    const [queueItems, setQueueItems] = useState<readonly PlayableItem[]>(() => queue.items)

    useEffect(() => {
        const subscription = queue.$events.subscribe(() => {
            setQueueItems([...queue.items])
        })
        return () => subscription.unsubscribe()
    }, [queue])
    const handleContainerDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        if (!e.dataTransfer.types.includes("x-magritte/song")) {
            return
        }
        e.preventDefault()
        e.dataTransfer.dropEffect = "copy"
    }, [])
    const handleContainerDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            if (!e.dataTransfer.types.includes("x-magritte/song")) {
                return
            }
            e.preventDefault()
            const songJson = e.dataTransfer.getData("x-magritte/song")
            const song = JSON.parse(songJson) as SongRead
            queue.push(song)
        },
        [queue],
    )

    const handleClearDragOver = useCallback((e: React.DragEvent<HTMLButtonElement>) => {
        if (!e.dataTransfer.types.includes("x-magritte/order")) {
            return
        }
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
    }, [])
    const handleClearDrop = useCallback(
        async (e: React.DragEvent<HTMLButtonElement>) => {
            if (!e.dataTransfer.types.includes("x-magritte/order")) {
                return
            }
            e.preventDefault()
            const source = Number(e.dataTransfer.getData("x-magritte/order"))
            await queue.removeAt(source)
        },
        [queue],
    )
    const handleClear = useCallback(async () => {
        await queue.clear()
    }, [queue])

    const handleItemDragStart = useCallback((e: React.DragEvent<HTMLLIElement>, source: number) => {
        e.dataTransfer.setData("x-magritte/order", String(source))
        e.dataTransfer.effectAllowed = "move"
    }, [])
    const handleItemDragOver = useCallback((e: React.DragEvent<HTMLLIElement>) => {
        if (!e.dataTransfer.types.includes("x-magritte/order")) {
            return
        }
        e.preventDefault()
        e.currentTarget.dataset.dragOver = ""
    }, [])
    const handleItemDragLeave = useCallback((e: React.DragEvent<HTMLLIElement>) => {
        if (!e.dataTransfer.types.includes("x-magritte/order")) {
            return
        }
        e.preventDefault()
        delete e.currentTarget.dataset.dragOver
    }, [])
    const handleItemDrop = useCallback(
        async (e: React.DragEvent<HTMLLIElement>, destination: number) => {
            if (!e.dataTransfer.types.includes("x-magritte/order")) {
                return
            }
            e.preventDefault()
            const source = Number(e.dataTransfer.getData("x-magritte/order"))
            await queue.move(source, destination)
            delete e.currentTarget.dataset.dragOver
        },
        [queue],
    )

    return (
        <div
            className="min-h-screen"
            onDragOver={handleContainerDragOver}
            onDrop={handleContainerDrop}
        >
            <header className="flex items-center gap-3 p-3">
                <span className="flex-1 font-bold text-xl">
                    {new Intl.NumberFormat().format(queueItems.length)}{" "}
                    {queueItems.length === 1 ? "Item" : "Items"}
                </span>
                <ThemedSubtleButton
                    buttonComponent={AsyncButton}
                    onClick={handleClear}
                    disabled={queueItems.length === 0}
                    onDragOver={handleClearDragOver}
                    onDrop={handleClearDrop}
                >
                    <TrashIcon aria-label="Clear" />
                </ThemedSubtleButton>
            </header>
            {queueItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 text-center p-3">
                    <CassetteTapeIcon weight="duotone" size="3rem" />
                    <span className="text-gray-500">
                        Drag and drop items here to create a quick mix.
                    </span>
                </div>
            ) : (
                <ol className="flex flex-col gap-1">
                    {queueItems.map((item, index) => (
                        <li
                            key={`quickMix.items[${item.id}]`}
                            className="px-2 py-1 text-sm cursor-pointer hover:bg-blue-50 data-drag-over:border-b-2 border-blue-100"
                            onClick={() =>
                                player.replaceQueue({
                                    newQueue: queue,
                                    startingItem: item,
                                    playNow: true,
                                })
                            }
                            onKeyDown={() => {}}
                            draggable={true}
                            onDragStart={(e) => handleItemDragStart(e, index)}
                            onDragOver={handleItemDragOver}
                            onDragLeave={handleItemDragLeave}
                            onDrop={(e) => handleItemDrop(e, index)}
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
