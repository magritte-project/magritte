import type { DraggableAttributes, UniqueIdentifier } from "@dnd-kit/core"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

export interface SortItemProps extends Omit<
    React.LiHTMLAttributes<HTMLLIElement>,
    "id" | keyof DraggableAttributes
> {
    readonly id: UniqueIdentifier
}

export default function SortableListItem({ id, style, ...rest }: SortItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

    return (
        <li
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                ...style,
            }}
            {...attributes}
            {...listeners}
            {...rest}
        />
    )
}
