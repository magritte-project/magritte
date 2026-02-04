import type { Queue, QueueEvent, QueueItemContext } from "@/playback/queue/base"

import { createEvent, type EventStream } from "@/utilities/events"

export default class EmptyQueue<Item extends { id: unknown }> implements Queue<Item> {
    constructor() {
        ;[, this.$events] = createEvent<QueueEvent>()
    }

    readonly $events: EventStream<QueueEvent>

    async hasItem(_item: Item): Promise<boolean> {
        return false
    }

    async firstItem(_context: QueueItemContext<Item["id"]>): Promise<Item | null> {
        return null
    }

    async lastItem(_context: QueueItemContext<Item["id"]>): Promise<Item | null> {
        return null
    }

    async itemPreceding(_item: Item, _context: QueueItemContext<Item["id"]>): Promise<Item | null> {
        return null
    }

    async itemFollowing(_item: Item, _context: QueueItemContext<Item["id"]>): Promise<Item | null> {
        return null
    }
}
