// TODO: figure out item ids

export interface QueueShardItem {
    readonly id: number
}

export interface QueueShard<ID extends string, Item extends QueueShardItem> {
    readonly id: ID
    firstItem(): Promise<Item | null>
    lastItem(): Promise<Item | null>
    itemPreceding(itemId: Item["id"]): Promise<Item | null>
    itemFollowing(itemId: Item["id"]): Promise<Item | null>
}

export class StaticQueueShard<ID extends string, Item extends QueueShardItem>
    implements QueueShard<ID, Item>
{
    // TODO: this can be 'open'
    constructor(
        readonly id: ID,
        private readonly items: readonly Item[],
    ) {}

    async firstItem(): Promise<Item | null> {
        if (this.items.length === 0) {
            return null
        }
        return this.items[0]
    }

    async lastItem(): Promise<Item | null> {
        if (this.items.length === 0) {
            return null
        }
        return this.items[this.items.length - 1]
    }

    async itemPreceding(itemId: Item["id"]): Promise<Item | null> {
        const itemIndex = this.items.findIndex((item) => item.id === itemId)
        if (itemIndex === -1 || itemIndex === 0) {
            return null
        }
        return this.items[itemIndex - 1]
    }

    async itemFollowing(itemId: Item["id"]): Promise<Item | null> {
        const itemIndex = this.items.findIndex((item) => item.id === itemId)
        if (itemIndex === -1 || itemIndex === this.items.length - 1) {
            return null
        }
        return this.items[itemIndex + 1]
    }
}

export interface OpenQueueShard<ID extends string, Item extends QueueShardItem>
    extends QueueShard<ID, Item> {
    readonly items: readonly Item[]
    putItems(newItems: readonly Item[], position?: number): Promise<this>
    removeItems(ItemIds: readonly Item["id"][]): Promise<this>
    moveItems(offsets: readonly Item[], destination: number): Promise<this>
}

export class Queue<ID extends string, Item extends QueueShardItem> {
    constructor(readonly shards: readonly QueueShard<ID, Item>[]) {}

    async firstItem(): Promise<[ID, Item] | null> {
        for (const shard of this.shards) {
            const firstItem = await shard.firstItem()
            if (firstItem !== null) {
                return [shard.id, firstItem]
            }
        }
        return null
    }

    async itemPreceding(shardId: ID, item: Item): Promise<[ID, Item] | null> {
        const startIndex = this.shards.findIndex(
            (shard) => shard.id === shardId,
        )
        if (startIndex === -1) {
            return null
        }
        // First we ask the shard for a preceding item
        const startingShard = this.shards[startIndex]
        const precedingItem = await startingShard.itemPreceding(item.id)
        if (precedingItem !== null) {
            return [startingShard.id, precedingItem]
        }
        // If that fails, we search for a preceding shard with a last item
        for (let i = startIndex - 1; i >= 0; i--) {
            const shard = this.shards[i]
            const lastItem = await shard.lastItem()
            if (lastItem !== null) {
                return [shard.id, lastItem]
            }
        }
        return null
    }

    async itemFollowing(shardId: ID, item: Item): Promise<[ID, Item] | null> {
        const startIndex = this.shards.findIndex(
            (shard) => shard.id === shardId,
        )
        if (startIndex === -1) {
            return null
        }
        // First we ask the shard for a following item
        const startingShard = this.shards[startIndex]
        const followingItem = await startingShard.itemFollowing(item.id)
        if (followingItem !== null) {
            return [startingShard.id, followingItem]
        }
        // If that fails, we search for a preceding shard with a last item
        for (let i = startIndex + 1; i < this.shards.length; i++) {
            const shard = this.shards[i]
            const firstItem = await shard.firstItem()
            if (firstItem !== null) {
                return [shard.id, firstItem]
            }
        }
        return null
    }

    async putShard(
        newShard: QueueShard<ID, Item>,
        position?: number,
    ): Promise<Queue<ID, Item>> {
        const shards = [...this.shards]
        const toRemove = shards.findIndex((shard) => shard.id === newShard.id)
        if (toRemove !== -1) {
            shards.splice(toRemove, 1)
        }
        if (position !== undefined) {
            shards.splice(position, 0, newShard)
        } else {
            shards.push(newShard)
        }
        return new Queue(shards)
    }

    async removeShard(idOrPosition: string | number): Promise<Queue<ID, Item>> {
        const shards = [...this.shards]
        if (typeof idOrPosition === "string") {
            const toRemove = shards.findIndex(
                (shard) => shard.id === idOrPosition,
            )
            if (toRemove !== -1) {
                shards.splice(toRemove, 1)
            }
        } else {
            shards.splice(idOrPosition, 1)
        }
        return new Queue(shards)
    }
}
