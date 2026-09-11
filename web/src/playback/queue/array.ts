import type { Queue, QueueEvent, RandomItemContext } from "@/playback/queue/base"
import { createEvent, type EventSink, type EventStream } from "@/utilities/events"

export default class ArrayQueue<Item extends { id: unknown }> implements Queue<Item> {
    private readonly _events: EventSink<QueueEvent>
    private readonly _items: Item[]

    static of<Item extends { id: unknown }>(...items: Item[]): ArrayQueue<Item> {
        return new ArrayQueue(items)
    }

    constructor(items: readonly Item[] = []) {
        ;[this._events, this.$events] = createEvent({ label: "ArrayQueue" })
        this._items = [...items]
    }

    readonly $events: EventStream<QueueEvent>

    get length(): number {
        return this._items.length
    }

    get items(): readonly Item[] {
        return this._items
    }

    async hasItem(item: Item): Promise<boolean> {
        return this._items.some((candidate) => candidate.id === item.id)
    }

    async firstItem(): Promise<Item | null> {
        if (this._items.length === 0) {
            return null
        }
        return this._items[0]
    }

    async lastItem(): Promise<Item | null> {
        if (this._items.length === 0) {
            return null
        }
        return this._items[this._items.length - 1]
    }

    async randomItem({
        getNumberOfPlayedItems,
        hasPlayedItem,
        randomIndex,
    }: RandomItemContext<Item>): Promise<Item | null> {
        const numberOfItems = this._items.length
        const maxAttempts = Math.max(0, numberOfItems - (await getNumberOfPlayedItems()))
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const index = await randomIndex(numberOfItems)
            const item = this._items[index]
            if (!(await hasPlayedItem(item))) {
                return item
            }
        }
        return null
    }

    async itemPreceding(item: Item): Promise<Item | null> {
        const itemIndex = this._items.findIndex((candidate) => candidate.id === item.id)
        if (itemIndex === -1 || itemIndex === 0) {
            return null
        }
        return this._items[itemIndex - 1]
    }

    async itemFollowing(item: Item): Promise<Item | null> {
        const itemIndex = this._items.findIndex((candidate) => candidate.id === item.id)
        if (itemIndex === -1 || itemIndex === this._items.length - 1) {
            return null
        }
        return this._items[itemIndex + 1]
    }

    async push(...items: readonly Item[]): Promise<void> {
        this._items.push(...items)
        await this._events({ type: "queueDidChange" })
    }

    async removeAt(index: number): Promise<Item> {
        if (index < 0 || index >= this._items.length) {
            throw new Error("Invalid index")
        }
        const removed = this._items.splice(index, 1)
        await this._events({ type: "queueDidChange" })
        return removed[0]
    }

    async move(source: number, destination: number): Promise<void> {
        if (
            source < 0 ||
            source >= this._items.length ||
            destination < 0 ||
            destination > this._items.length
        ) {
            throw new Error("Invalid index")
        }
        const item = this._items.splice(source, 1)[0]
        this._items.splice(destination, 0, item)
        await this._events({ type: "queueDidChange" })
    }

    async clear(): Promise<void> {
        this._items.length = 0
        await this._events({ type: "queueDidChange" })
    }
}
