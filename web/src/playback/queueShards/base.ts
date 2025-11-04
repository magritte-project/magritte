import type { APIClient } from "@/api/client"
import type { QueryClient } from "@tanstack/react-query"

export interface QueueShard<Item> {
    readonly id: string
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
