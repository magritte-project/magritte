import type { Queue, QueueEvent, RandomItemContext } from "@/playback/queue/base"
import { createEvent, type EventStream } from "@/utilities/events"

export default class EmptyQueue<Item extends { id: unknown }> implements Queue<Item> {
    constructor() {
        ;[, this.$events] = createEvent<QueueEvent>()
    }

    readonly $events: EventStream<QueueEvent>

    async hasItem(_item: Item): Promise<boolean> {
        return false
    }

    async firstItem(): Promise<Item | null> {
        return null
    }

    async lastItem(): Promise<Item | null> {
        return null
    }

    async randomItem(_context: RandomItemContext<Item>): Promise<Item | null> {
        return null
    }

    async itemPreceding(_item: Item): Promise<Item | null> {
        return null
    }

    async itemFollowing(_item: Item): Promise<Item | null> {
        return null
    }
}
