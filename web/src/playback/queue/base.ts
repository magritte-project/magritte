import type { API } from "@magritte/api"
import type { QueryClient } from "@tanstack/react-query"

import type { EventStream } from "@/utilities/events"

export type QueueEvent = { type: "queueDidChange" }

export interface RandomItemContext<Item extends { id: unknown }> {
    /** Retrieve the number of played items */
    getNumberOfPlayedItems(): Promise<number>

    /** Check whether an item has already been played */
    hasPlayedItem(item: Item): Promise<boolean>

    /** Get a random index */
    randomIndex(length: number): Promise<number>
}

export interface Queue<Item extends { id: unknown }> {
    readonly $events: EventStream<QueueEvent>
    hasItem(item: Item): Promise<boolean>
    firstItem(): Promise<Item | null>
    lastItem(): Promise<Item | null>
    randomItem(context: RandomItemContext<Item>): Promise<Item | null>
    itemPreceding(item: Item): Promise<Item | null>
    itemFollowing(item: Item): Promise<Item | null>
}

export interface QueueContext {
    readonly api: API
    readonly queryClient: QueryClient
}
