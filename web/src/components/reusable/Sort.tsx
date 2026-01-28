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
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

function SortableItem({ id }: { id: string }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {id}
        </div>
    )
}

export type SortableKey<Key extends string> = `+${Key}` | `-${Key}`

export interface SortProps<Key extends string> {
    readonly keys: readonly Key[]
    readonly order: SortableKey<Key>[]
    readonly setOrder: React.Dispatch<React.SetStateAction<SortableKey<Key>[]>>
}

export default function Sort<Key extends string>({ order, setOrder }: SortProps<Key>) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    )

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
                {order.map((sort) => (
                    <SortableItem key={sort} id={sort} />
                ))}
            </SortableContext>
        </DndContext>
    )

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        console.log(event)
        if (over && active.id !== over.id) {
            setOrder((order) => {
                const oldIndex = order.indexOf(active.id as SortableKey<Key>)
                const newIndex = order.indexOf(over.id as SortableKey<Key>)

                return arrayMove(order, oldIndex, newIndex)
            })
        }
    }
}
