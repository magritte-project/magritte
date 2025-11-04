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
        this._subscriptions.delete(id)
    }

    async dispatch(event: TEvent): Promise<void> {
        for (const callback of this._subscriptions.values()) {
            await callback(event)
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

export class EventSource<TEvent> {
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

export function createEvent<TEvent>(): [
    EventSink<TEvent>,
    EventSource<TEvent>,
] {
    const emitter = new EventImplementation<TEvent>()
    return [new EventSink(emitter), new EventSource(emitter)]
}
