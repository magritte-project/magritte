export type EventCallback<TEvent> = (event: TEvent) => void | Promise<void>

class EventImplementation<TEvent> {
    private readonly _subscriptions: Map<number, EventCallback<TEvent>>
    private _nextId: number

    constructor() {
        this._subscriptions = new Map()
        this._nextId = 0
    }

    subscribe(callback: EventCallback<TEvent>): number {
        const id = this._nextId++
        this._subscriptions.set(id, callback)
        return id
    }

    unsubscribe(id: number): void {
        if (!this._subscriptions.delete(id)) {
            throw new Error(`No subscription with id ${id}`)
        }
    }

    async dispatch(event: TEvent): Promise<void> {
        for (const callback of this._subscriptions.values()) {
            try {
                await callback(event)
            } catch (error) {
                console.error(`*** Unhandled error in event callback: ${error}`)
            }
        }
    }
}

export class EventSubscription<TEvent> {
    /** @hideconstructor */
    constructor(
        private readonly implementation: EventImplementation<TEvent>,
        private readonly id: number,
    ) {}

    unsubscribe(): void {
        this.implementation.unsubscribe(this.id)
    }
}

export class EventStream<TEvent> {
    /** @hideconstructor */
    constructor(private readonly implementation: EventImplementation<TEvent>) {}

    subscribe(callback: EventCallback<TEvent>): EventSubscription<TEvent> {
        const id = this.implementation.subscribe(callback)
        return new EventSubscription(this.implementation, id)
    }
}

export class EventSink<TEvent> {
    /** @hideconstructor */
    constructor(private readonly implementation: EventImplementation<TEvent>) {}

    async dispatch(event: TEvent): Promise<void> {
        await this.implementation.dispatch(event)
    }
}

/**
 * Create an event sink and stream pair to expose events from an object.
 *
 * To use, declare a private property to hold the event sink and a public
 * property to expose the event stream. By convention, the sink should be
 * prefixed with an underscore `_` and the stream with a dollar sign `$`:
 *
 * ```typescript
 * private readonly _events: EventSink<MyEvent>
 * readonly $events: EventStream<MyEvent>
 *
 * constructor() {
 *     ;[this._events, this.$events] = createEvent()
 * }
 * ```
 *
 * @returns An event sink and an event stream.
 */
export function createEvent<TEvent>(): [EventSink<TEvent>, EventStream<TEvent>] {
    const emitter = new EventImplementation<TEvent>()
    return [new EventSink(emitter), new EventStream(emitter)]
}
