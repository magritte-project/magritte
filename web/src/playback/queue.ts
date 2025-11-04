import type { QueueShard } from "@/playback/queueShards/base"

export interface QueueEntry<Item> {
    readonly shard: QueueShard<Item>
    readonly item: Item
}

export class Queue<Item> {
    private readonly _shardIndices: Map<string, number>

    static with<Item>(...shards: readonly QueueShard<Item>[]): Queue<Item> {
        return new Queue(shards)
    }

    constructor(readonly shards: readonly QueueShard<Item>[] = []) {
        this._shardIndices = new Map(
            shards.map((shard, index) => [shard.id, index]),
        )
    }

    get length(): number {
        return this.shards.reduce((acc, shard) => acc + shard.length, 0)
    }

    async entryForItem(item: Item): Promise<QueueEntry<Item> | null> {
        for (const shard of this.shards) {
            if (await shard.containsItem(item)) {
                return { shard, item }
            }
        }
        return null
    }

    async firstEntry(): Promise<QueueEntry<Item> | null> {
        for (const shard of this.shards) {
            const item = await shard.firstItem()
            if (item !== null) {
                return { shard, item }
            }
        }
        return null
    }

    async entryPreceding(
        entry: QueueEntry<Item>,
    ): Promise<QueueEntry<Item> | null> {
        const startIndex = this._shardIndices.get(entry.shard.id)
        if (startIndex === undefined) {
            return null
        }
        // First we ask the shard for a preceding item
        const startingShard = this.shards[startIndex]
        const precedingItem = await startingShard.itemPreceding(entry.item)
        if (precedingItem !== null) {
            return { shard: startingShard, item: precedingItem }
        }
        // If that fails, we search for a preceding shard with a last item
        for (let i = startIndex - 1; i >= 0; i--) {
            const previousShard = this.shards[i]
            const lastItem = await previousShard.lastItem()
            if (lastItem !== null) {
                return { shard: previousShard, item: lastItem }
            }
        }
        return null
    }

    async entryFollowing(
        entry: QueueEntry<Item>,
    ): Promise<QueueEntry<Item> | null> {
        const startIndex = this._shardIndices.get(entry.shard.id)
        if (startIndex === undefined) {
            return null
        }
        // First we ask the shard for a following item
        const startingShard = this.shards[startIndex]
        const followingItem = await startingShard.itemFollowing(entry.item)
        if (followingItem !== null) {
            return { shard: startingShard, item: followingItem }
        }
        // If that fails, we search for a preceding shard with a last item
        for (let i = startIndex + 1; i < this.shards.length; i++) {
            const nextShard = this.shards[i]
            const firstItem = await nextShard.firstItem()
            if (firstItem !== null) {
                return { shard: nextShard, item: firstItem }
            }
        }
        return null
    }

    async putShard(
        newShard: QueueShard<Item>,
        position?: number,
    ): Promise<Queue<Item>> {
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

    async removeShard(idOrPosition: string | number): Promise<Queue<Item>> {
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
