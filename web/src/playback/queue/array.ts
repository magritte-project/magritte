import type { Queue, QueueEvent, QueueItemContext } from "@/playback/queue/base"

import { createEvent, EventSink, type EventStream } from "@/utilities/events"

export default class ArrayQueue<Item extends { id: unknown }> implements Queue<Item> {
    private readonly _events: EventSink<QueueEvent>
    private readonly _items: Item[]

    static of<Item extends { id: unknown }>(...items: Item[]): ArrayQueue<Item> {
        return new ArrayQueue(items)
    }

    constructor(items: readonly Item[] = []) {
        ;[this._events, this.$events] = createEvent<QueueEvent>()
        this._items = [...items]
    }

    readonly $events: EventStream<QueueEvent>

    async hasItem(item: Item): Promise<boolean> {
        return this._items.some((candidate) => candidate.id === item.id)
    }

    async firstItem(_context: QueueItemContext<Item["id"]>): Promise<Item | null> {
        if (this._items.length === 0) {
            return null
        }
        return this._items[0]
    }

    async lastItem(_context: QueueItemContext<Item["id"]>): Promise<Item | null> {
        if (this._items.length === 0) {
            return null
        }
        return this._items[this._items.length - 1]
    }

    async itemPreceding(item: Item, _context: QueueItemContext<Item["id"]>): Promise<Item | null> {
        const itemIndex = this._items.findIndex((candidate) => candidate.id === item.id)
        if (itemIndex === -1 || itemIndex === 0) {
            return null
        }
        return this._items[itemIndex - 1]
    }

    async itemFollowing(item: Item, _context: QueueItemContext<Item["id"]>): Promise<Item | null> {
        const itemIndex = this._items.findIndex((candidate) => candidate.id === item.id)
        if (itemIndex === -1 || itemIndex === this._items.length - 1) {
            return null
        }
        return this._items[itemIndex + 1]
    }

    async push(...items: readonly Item[]): Promise<void> {
        this._items.push(...items)
        await this._events.dispatch({ type: "queueDidChange" })
    }

    async removeAt(index: number): Promise<Item> {
        if (index < 0 || index >= this._items.length) {
            throw new Error("Invalid index")
        }
        const removed = this._items.splice(index, 1)
        await this._events.dispatch({ type: "queueDidChange" })
        return removed[0]
    }
}
