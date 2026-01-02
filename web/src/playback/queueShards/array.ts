import type { QueueShard, QueueShardID } from "@/playback/queueShards/base"

export class ArrayQueueShard<Item extends { id: unknown }>
    implements QueueShard<Item>
{
    constructor(
        readonly id: QueueShardID,
        readonly items: readonly Item[],
    ) {}

    get length(): number {
        return this.items.length
    }

    async containsItem(item: Item): Promise<boolean> {
        return this.items.some((candidate) => candidate.id === item.id)
    }

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

    async itemPreceding(item: Item): Promise<Item | null> {
        const itemIndex = this.items.findIndex(
            (candidate) => candidate.id === item.id,
        )
        if (itemIndex === -1 || itemIndex === 0) {
            return null
        }
        return this.items[itemIndex - 1]
    }

    async itemFollowing(item: Item): Promise<Item | null> {
        const itemIndex = this.items.findIndex(
            (candidate) => candidate.id === item.id,
        )
        if (itemIndex === -1 || itemIndex === this.items.length - 1) {
            return null
        }
        return this.items[itemIndex + 1]
    }
}
