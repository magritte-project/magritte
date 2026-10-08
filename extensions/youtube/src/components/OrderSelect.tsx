import { VIDEO_ORDER_LABELS, type VideoOrder } from "@/youtube/browse"

export interface OrderSelectProps {
    readonly orders: readonly VideoOrder[]
    readonly value: VideoOrder
    readonly onChange: (order: VideoOrder) => void
}

/** Chooses how a list of videos is ordered */
export default function OrderSelect({ orders, value, onChange }: OrderSelectProps) {
    return (
        <select
            aria-label="Order by"
            className="rounded-md bg-black/5 px-1.5 py-0.5 text-xs font-semibold text-gray-950 hover:bg-black/10"
            value={value}
            onChange={(event) => onChange(event.currentTarget.value as VideoOrder)}
        >
            {orders.map((order) => (
                <option key={order} value={order}>
                    {VIDEO_ORDER_LABELS[order]}
                </option>
            ))}
        </select>
    )
}
