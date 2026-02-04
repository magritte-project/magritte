import type { QueryClient } from "@tanstack/react-query"

import type { APIClient } from "@/api/client"
import type { PlaybackModes } from "@/playback/modes"
import type { EventStream } from "@/utilities/events"

export type QueueEvent = { type: "queueDidChange" }

export interface QueueItemContext<ItemID> {
    /** Get the current playback modes */
    getPlaybackModes(): Promise<PlaybackModes>

    /** Check whether an item has already been played */
    hasPlayedItem(itemId: ItemID): Promise<boolean>
}

export interface Queue<Item extends { id: unknown }> {
    readonly $events: EventStream<QueueEvent>
    hasItem(item: Item): Promise<boolean>
    firstItem(context: QueueItemContext<Item["id"]>): Promise<Item | null>
    lastItem(context: QueueItemContext<Item["id"]>): Promise<Item | null>
    itemPreceding(item: Item, context: QueueItemContext<Item["id"]>): Promise<Item | null>
    itemFollowing(item: Item, context: QueueItemContext<Item["id"]>): Promise<Item | null>
}

export interface QueueContext {
    readonly apiClient: APIClient
    readonly queryClient: QueryClient
}
