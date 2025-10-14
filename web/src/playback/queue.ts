import type { QueueItem, QueueItemID } from "@/playback/item"

export interface QueueShard {
    readonly id: string
    firstItem(): Promise<QueueItem | null>
    itemPreceding(itemID: QueueItemID): Promise<QueueItem | null>
    itemFollowing(itemID: QueueItemID): Promise<QueueItem | null>
}

export interface OpenQueueShard extends QueueShard {
    readonly items: readonly QueueItem[]
    putItems(newItems: readonly QueueItem[], position?: number): Promise<this>
    removeItems(itemIDs: readonly QueueItemID[]): Promise<this>
    moveItems(offsets: readonly number[], destination: number): Promise<this>
}

export interface QueuePath {
    readonly shard: QueueShard
    readonly item: QueueItem
}

export class Queue {
    constructor() {
        this._shards = []
    }

    private readonly _shards: QueueShard[]

    async putShard(newShard: QueueShard, position?: number): Promise<void> {
        if (position !== undefined) {
            this._shards.splice(position, 0, newShard)
        } else {
            this._shards.push(newShard)
        }
    }

    async firstItem(): Promise<QueuePath | null> {
        if (this._shards.length === 0) {
            return null
        }
        for (const shard of this._shards) {
            const item = await shard.firstItem()
            if (item === null) {
                continue
            }
            return { shard, item }
        }
        return null
    }
}
