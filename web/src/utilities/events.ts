/**
 * A function which is called when an event is dispatched.
 *
 * @param event A dispatched event.
 * @returns A promise if the callback performs async work; `undefined` otherwise.
 */
export type EventCallback<TEvent> = (event: TEvent) => void | Promise<void>

/**
 * A function that unsubscribes a callback from an event stream.
 */
export type EventCallbackUnsubscriber = () => void

/**
 * A function that dispatches an event to all subscribed callbacks.
 *
 * @param event The event to dispatch.
 * @returns A promise that resolves when all callbacks have been called.
 */
export type EventSink<TEvent> = (event: TEvent) => Promise<void>

/**
 * A function that subscribes a callback to an event stream,
 * returning another function to unsubscribe it.
 *
 * @param callback The function to call when the event is dispatched.
 * @returns A function which unsubscribes the callback when called.
 */
export type EventStream<TEvent> = (callback: EventCallback<TEvent>) => EventCallbackUnsubscriber

export interface EventCreateOptions {
    /** Optional label for the event to improve logging */
    readonly label?: string

    /** Whether to await each callback before continuing */
    readonly awaitsCallbacks?: boolean
}

function buildEventSink<TEvent>(
    callbacks: EventCallback<TEvent>[],
    { label = "anonymous", awaitsCallbacks = true }: EventCreateOptions,
): EventSink<TEvent> {
    const callOut = async (callback: EventCallback<TEvent>, event: TEvent) => {
        try {
            await callback(event)
        } catch (error) {
            console.error(`*** Unhandled error in ${label} event callback`, error)
        }
    }
    if (awaitsCallbacks) {
        return async (event: TEvent) => {
            for (const callback of callbacks) {
                await callOut(callback, event)
            }
        }
    } else {
        return async (event: TEvent) => {
            for (const callback of callbacks) {
                callOut(callback, event)
            }
        }
    }
}

function buildEventStream<TEvent>(callbacks: EventCallback<TEvent>[]): EventStream<TEvent> {
    return (callback: EventCallback<TEvent>) => {
        callbacks.push(callback)
        return () => {
            const index = callbacks.indexOf(callback)
            if (index !== -1) {
                callbacks.splice(index, 1)
            }
        }
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
 * private readonly _dispatch: EventSink<MyEvent>
 * readonly subscribe: EventStream<MyEvent>
 *
 * constructor() {
 *     ;[this._dispatch, this.subscribe] = createEvent()
 * }
 * ```
 *
 * To dispatch an event, call the sink directly: `this._dispatch(event)`.
 *
 * To subscribe, call the stream directly: `const unsubscribe = this.subscribe(callback)`.
 * The stream returns an unsubscribe function; call it to stop receiving events.
 *
 * @returns A tuple of a sink and a stream.
 */
export function createEvent<TEvent>(
    options: EventCreateOptions = {},
): [EventSink<TEvent>, EventStream<TEvent>] {
    const callbacks: EventCallback<TEvent>[] = []
    const sink = buildEventSink<TEvent>(callbacks, options)
    const stream = buildEventStream<TEvent>(callbacks)
    return [sink, stream]
}

/**
 * Creates an event callback that invokes the provided callback
 * only when the discriminator field matches.
 *
 * Usage:
 * ```typescript
 * const unsubscribe = player.subscribe(justEventsMatching("type", "playingItemChanged", ({ playingItem }) => {
 *     ...
 * }))
 * ```
 *
 * @param discriminator The key of the discriminator field in the event type.
 * @param type The value of the discriminator field to match.
 * @param callback The callback to invoke when the event is dispatched.
 * @returns An event callback that invokes the provided callback
 * only when the discriminator field matches.
 */
export function justEventsMatching<
    TEvent extends {},
    TDiscriminator extends keyof TEvent,
    TType extends TEvent[TDiscriminator],
>(
    discriminator: TDiscriminator,
    type: TType,
    callback: EventCallback<Extract<TEvent, { [discriminator]: TType }>>,
): EventCallback<TEvent> {
    return async (event: TEvent) => {
        if (event[discriminator] === type) {
            await callback(event as Extract<TEvent, { [discriminator]: TType }>)
        }
    }
}

/**
 * Combines multiple unsubscribe functions into a single function that calls all of them.
 *
 * @param unsubscribers The unsubscribers to combine.
 * @returns An unsubscribe function that calls all the provided unsubscribers.
 */
export function combineUnsubscribers(
    ...unsubscribers: EventCallbackUnsubscriber[]
): EventCallbackUnsubscriber {
    return () => {
        for (const unsubscribe of unsubscribers) {
            unsubscribe()
        }
    }
}
