import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { DotsSixVerticalIcon, PlusIcon } from "@phosphor-icons/react"
import { SortAscendingIcon, SortDescendingIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr"
import { useCallback, useMemo } from "react"

import SortableListItem from "@/components/reusable/SortableListItem"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import { getKey, isAscending, reverseOrder, type SortableKey } from "@/utilities/sorting"

export interface SortControlProps<Key extends string> {
    readonly keys: readonly Key[]
    readonly labels: Record<Key, string>
    readonly order: SortableKey<Key>[]
    readonly setOrder: React.Dispatch<React.SetStateAction<SortableKey<Key>[]>>
}

export default function SortControl<Key extends string>({
    keys,
    labels,
    order,
    setOrder,
}: SortControlProps<Key>) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    )

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event

            if (over && active.id !== over.id) {
                setOrder((order) => {
                    const oldIndex = order.indexOf(active.id as SortableKey<Key>)
                    const newIndex = order.indexOf(over.id as SortableKey<Key>)

                    return arrayMove(order, oldIndex, newIndex)
                })
            }
        },
        [setOrder],
    )

    const handleRemove = useCallback(
        (key: SortableKey<Key>) => {
            setOrder((order) => order.filter((k) => k !== key))
        },
        [setOrder],
    )

    const handleReverse = useCallback(
        (key: SortableKey<Key>) => {
            setOrder((order) => {
                const newOrder = [...order]
                const toReplace = newOrder.indexOf(key)
                newOrder[toReplace] = reverseOrder(key)
                return newOrder
            })
        },
        [setOrder],
    )

    const handleAdd = useCallback(
        (key: Key) => {
            setOrder((order) => [...order, `+${key}`])
        },
        [setOrder],
    )

    const availableKeys = useMemo(() => {
        const availableKeys = new Set<Key>(keys)
        for (const key of order) {
            availableKeys.delete(getKey(key))
        }
        return Array.from(availableKeys)
    }, [keys, order])

    return (
        <div className="flex flex-col gap-between">
            <header className="text-xs font-bold">Sorting By</header>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={order} strategy={verticalListSortingStrategy}>
                    <ol className="flex flex-col gap-3">
                        {order.map((key) => (
                            <SortableListItem
                                key={key}
                                id={key}
                                className="bg-secondary odd:bg-inherit hover:bg-key-subtle rounded-md flex items-center gap-2 px-2 py-1 cursor-default"
                            >
                                <DotsSixVerticalIcon
                                    className="text-placeholder"
                                    weight="bold"
                                    aria-label="Reorderable"
                                />
                                <span className="flex-1 text-sm truncate">
                                    {labels[getKey(key)]}
                                </span>
                                <ThemedSubtleButton
                                    className="bg-tertiary active:bg-tertiary-active-active"
                                    onClick={() => handleReverse(key)}
                                >
                                    {isAscending(key) ? (
                                        <SortAscendingIcon aria-label="Ascending" />
                                    ) : (
                                        <SortDescendingIcon aria-label="Descending" />
                                    )}
                                </ThemedSubtleButton>
                                <ThemedSubtleButton
                                    className="bg-tertiary active:bg-tertiary-active-active"
                                    onClick={() => handleRemove(key)}
                                >
                                    <TrashIcon aria-label="Remove" />
                                </ThemedSubtleButton>
                            </SortableListItem>
                        ))}
                    </ol>
                </SortableContext>
                <header className="text-xs font-bold mt-between">Available</header>
                <ol className="flex flex-col gap-3">
                    {availableKeys.map((key) => (
                        <li
                            key={key}
                            className="bg-secondary odd:bg-inherit hover:bg-key-subtle rounded-md flex items-center gap-2 px-2 py-1 cursor-default"
                        >
                            <span className="flex-1 text-sm truncate">{labels[key]}</span>
                            <ThemedSubtleButton
                                className="bg-tertiary active:bg-tertiary-active-active"
                                onClick={() => handleAdd(key)}
                            >
                                <PlusIcon aria-label="Add" />
                            </ThemedSubtleButton>
                        </li>
                    ))}
                </ol>
            </DndContext>
        </div>
    )
}
