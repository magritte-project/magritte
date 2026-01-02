import type { APIClient } from "@/api/client"
import type { QueryClient } from "@tanstack/react-query"

export type QueueShardID = string

export function uniqueQueueShardID(): QueueShardID {
    return `queue.shards[${crypto.randomUUID()}]`
}

export interface QueueShard<Item> {
    readonly id: QueueShardID
    readonly length: number
    containsItem(item: Item): Promise<boolean>
    firstItem(): Promise<Item | null>
    lastItem(): Promise<Item | null>
    itemPreceding(item: Item): Promise<Item | null>
    itemFollowing(item: Item): Promise<Item | null>
}

export interface QueueShardContext {
    readonly apiClient: APIClient
    readonly queryClient: QueryClient
}
