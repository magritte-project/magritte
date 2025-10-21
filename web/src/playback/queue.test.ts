import { describe, expect, it } from "vitest"
import { Queue, type QueueShard } from "./queue"

describe("Queue", () => {
    class StubQueueShard implements QueueShard<string> {
        constructor(readonly items: readonly string[]) {
            this.id = `shard-${Math.random()}`
        }

        readonly id: string

        async containsItem(item: string): Promise<boolean> {
            return this.items.includes(item)
        }

        async firstItem(): Promise<string | null> {
            if (this.items.length === 0) {
                return null
            }
            return this.items[0]
        }

        async lastItem(): Promise<string | null> {
            if (this.items.length === 0) {
                return null
            }
            return this.items[this.items.length - 1]
        }

        async itemPreceding(item: string): Promise<string | null> {
            const itemIndex = this.items.findIndex(
                (candidate) => candidate === item,
            )
            if (itemIndex === -1 || itemIndex === 0) {
                return null
            }
            return this.items[itemIndex - 1]
        }

        async itemFollowing(item: string): Promise<string | null> {
            const itemIndex = this.items.findIndex(
                (candidate) => candidate === item,
            )
            if (itemIndex === -1 || itemIndex === this.items.length - 1) {
                return null
            }
            return this.items[itemIndex + 1]
        }
    }

    function stubItem(): string {
        return `item-${Math.random()}`
    }

    describe("#entryForItem", () => {
        it("should return the shard which contains the item", async () => {
            const firstItem = stubItem()
            const secondItem = stubItem()
            const subject = new Queue([
                new StubQueueShard([firstItem]),
                new StubQueueShard([secondItem]),
            ])
            await expect(
                subject.entryForItem(secondItem),
            ).resolves.toMatchObject({
                shard: subject.shards[1],
                item: secondItem,
            })
        })

        it("should return null if the item is not in the queue", async () => {
            const firstItem = stubItem()
            const secondItem = stubItem()
            const subject = new Queue([new StubQueueShard([firstItem])])
            await expect(subject.entryForItem(secondItem)).resolves.toBeNull()
        })
    })

    describe("#firstItem", () => {
        it("should return the first item from the first shard", async () => {
            const onlyItem = stubItem()
            const subject = new Queue([new StubQueueShard([onlyItem])])
            await expect(subject.firstEntry()).resolves.toMatchObject({
                shard: subject.shards[0],
                item: onlyItem,
            })
        })

        it("should search for the first non-empty shard", async () => {
            const onlyItem = stubItem()
            const subject = new Queue([
                new StubQueueShard([]),
                new StubQueueShard([]),
                new StubQueueShard([onlyItem]),
            ])
            await expect(subject.firstEntry()).resolves.toMatchObject({
                shard: subject.shards[2],
                item: onlyItem,
            })
        })

        it("should return null if the queue is empty", async () => {
            const subject = new Queue([])
            await expect(subject.firstEntry()).resolves.toBeNull()
        })
    })

    describe("#itemPreceding", () => {
        it("should return the preceding item from the shard", async () => {
            const firstItem = stubItem()
            const secondItem = stubItem()
            const subject = new Queue([
                new StubQueueShard([firstItem, secondItem]),
            ])
            await expect(
                subject.entryPreceding({
                    shard: subject.shards[0],
                    item: secondItem,
                }),
            ).resolves.toMatchObject({
                shard: subject.shards[0],
                item: firstItem,
            })
        })

        it("should scan preceding shards for an item", async () => {
            const firstItem = stubItem()
            const secondItem = stubItem()
            const subject = new Queue([
                new StubQueueShard([firstItem]),
                new StubQueueShard([secondItem]),
            ])
            await expect(
                subject.entryPreceding({
                    shard: subject.shards[1],
                    item: secondItem,
                }),
            ).resolves.toMatchObject({
                shard: subject.shards[0],
                item: firstItem,
            })
        })

        it("should return null if there is no preceeding item", async () => {
            const onlyItem = stubItem()
            const subject = new Queue([new StubQueueShard([onlyItem])])
            await expect(
                subject.entryPreceding({
                    shard: subject.shards[0],
                    item: onlyItem,
                }),
            ).resolves.toBeNull()
        })
    })

    describe("#itemFollowing", () => {
        it("should return the following item from the shard", async () => {
            const firstItem = stubItem()
            const secondItem = stubItem()
            const subject = new Queue([
                new StubQueueShard([firstItem, secondItem]),
            ])
            await expect(
                subject.entryFollowing({
                    shard: subject.shards[0],
                    item: firstItem,
                }),
            ).resolves.toMatchObject({
                shard: subject.shards[0],
                item: secondItem,
            })
        })

        it("should scan following shards for an item", async () => {
            const firstItem = stubItem()
            const secondItem = stubItem()
            const subject = new Queue([
                new StubQueueShard([firstItem]),
                new StubQueueShard([secondItem]),
            ])
            await expect(
                subject.entryFollowing({
                    shard: subject.shards[0],
                    item: firstItem,
                }),
            ).resolves.toMatchObject({
                shard: subject.shards[1],
                item: secondItem,
            })
        })

        it("should return null if there is no preceeding item", async () => {
            const onlyItem = stubItem()
            const subject = new Queue([new StubQueueShard([onlyItem])])
            await expect(
                subject.entryFollowing({
                    shard: subject.shards[0],
                    item: onlyItem,
                }),
            ).resolves.toBeNull()
        })
    })

    describe("#putShard", () => {
        it("should return a copy with the shard appended", async () => {
            const original = new Queue([])
            const copy = await original.putShard(new StubQueueShard([]))
            expect(original.shards).toHaveLength(0)
            expect(copy.shards).toHaveLength(1)
        })

        it("should return a copy with the shard copied", async () => {
            const original = new Queue([
                new StubQueueShard([]),
                new StubQueueShard([]),
            ])
            const copy = await original.putShard(new StubQueueShard([]), 1)
            expect(original.shards).toHaveLength(2)
            expect(copy.shards).toHaveLength(3)
            expect(copy.shards[0].id).toStrictEqual(original.shards[0].id)
            expect(copy.shards[2].id).toStrictEqual(original.shards[1].id)
        })

        it("should return a copy with the shard moved", async () => {
            const specificShard = new StubQueueShard([])
            const original = new Queue([
                specificShard,
                new StubQueueShard([]),
                new StubQueueShard([]),
            ])
            const copy = await original.putShard(specificShard)
            expect(copy.shards[0].id).not.toStrictEqual(specificShard.id)
            expect(copy.shards[2].id).toStrictEqual(specificShard.id)
        })
    })

    describe("#removeShard", () => {
        it("should return a copy with the shard removed by id", async () => {
            const specificShard = new StubQueueShard([])
            const original = new Queue([specificShard, new StubQueueShard([])])
            const copy = await original.removeShard(specificShard.id)
            expect(original.shards).toHaveLength(2)
            expect(copy.shards).toHaveLength(1)
        })

        it("should return a copy with the shard removed by position", async () => {
            const specificShard = new StubQueueShard([])
            const original = new Queue([specificShard, new StubQueueShard([])])
            const copy = await original.removeShard(0)
            expect(original.shards).toHaveLength(2)
            expect(copy.shards).toHaveLength(1)
        })

        it("should ignore shards that are not in the queue", async () => {
            const original = new Queue([new StubQueueShard([])])
            const copy = await original.removeShard("does not exist")
            expect(original.shards).toHaveLength(1)
            expect(copy.shards).toHaveLength(1)
        })
    })
})
