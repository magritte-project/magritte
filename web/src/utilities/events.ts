/**
 * A function which is called when an event is dispatched.
 *
 * @param event A dispatched event.
 * @returns A promise if the callback performs async work; `undefined` otherwise.
 */
export type EventSubscriber<TEvent> = (event: TEvent) => void | Promise<void>

/**
 * A function that stops a subscriber being called when an event is dispatched.
 */
export type EventUnsubscriber = () => void

/**
 * A function that dispatches an event to all subscribed callbacks.
 *
 * @param event The event to dispatch.
 * @returns A promise that resolves when all callbacks have been called.
 */
export type EventDispatch<TEvent> = (event: TEvent) => Promise<void>

/**
 * A function that subscribes a callback to an event,
 * returning another function to unsubscribe it.
 *
 * @param subscriber The function to call when the event is dispatched.
 * @returns A function which unsubscribes the subscriber when called.
 */
export type EventSubscribe<TEvent> = (subscriber: EventSubscriber<TEvent>) => EventUnsubscriber

export interface EventCreateOptions {
    /** Optional label for the event to improve logging */
    readonly label?: string

    /** Whether to await each subscriber before continuing */
    readonly awaitSubscribers?: boolean
}

function buildEventDispatch<TEvent>(
    subscribers: EventSubscriber<TEvent>[],
    { label = "anonymous", awaitSubscribers = true }: EventCreateOptions,
): EventDispatch<TEvent> {
    const callOut = async (subscriber: EventSubscriber<TEvent>, event: TEvent) => {
        try {
            await subscriber(event)
        } catch (error) {
            console.error(`*** Unhandled error in ${label} event subscriber`, error)
        }
    }
    if (awaitSubscribers) {
        return async (event: TEvent) => {
            for (const subscriber of subscribers.slice()) {
                await callOut(subscriber, event)
            }
        }
    } else {
        return async (event: TEvent) => {
            for (const subscriber of subscribers.slice()) {
                callOut(subscriber, event)
            }
        }
    }
}

function buildEventSubscribe<TEvent>(
    subscribers: EventSubscriber<TEvent>[],
): EventSubscribe<TEvent> {
    return (subscriber: EventSubscriber<TEvent>) => {
        subscribers.push(subscriber)
        return () => {
            const index = subscribers.indexOf(subscriber)
            if (index !== -1) {
                subscribers.splice(index, 1)
            }
        }
    }
}

/**
 * Create dispatch and subscribe functions to expose events from an object.
 *
 * To use, declare a private property to hold the dispatch and a public
 * property to expose the subscribe:
 *
 * ```typescript
 * private readonly _dispatch: EventDispatch<MyEvent>
 * readonly subscribe: EventSubscribe<MyEvent>
 *
 * constructor() {
 *     ;[this._dispatch, this.subscribe] = createEvent()
 * }
 * ```
 *
 * To dispatch an event, use the dispatch function: `this._dispatch(event)`.
 *
 * To subscribe, call the subscribe function: `const unsubscribe = this.subscribe(callback)`.
 * The subscribe function returns an unsubscribe function; call it to stop receiving events.
 *
 * @returns A tuple of a dispatch and a subscribe function.
 */
export function createEvent<TEvent>(
    options: EventCreateOptions = {},
): [EventDispatch<TEvent>, EventSubscribe<TEvent>] {
    const callbacks: EventSubscriber<TEvent>[] = []
    const dispatch = buildEventDispatch<TEvent>(callbacks, options)
    const subscribe = buildEventSubscribe<TEvent>(callbacks)
    return [dispatch, subscribe]
}

/**
 * Creates an event subscriber that invokes the provided
 * subscriber only when the discriminator field matches.
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
 * @param subscriber The subscriber to invoke when the event is dispatched.
 * @returns An event subscriber that invokes the provided subscriber
 * only when the discriminator field matches.
 */
export function justEventsMatching<
    TEvent extends {},
    TDiscriminator extends keyof TEvent,
    const TType extends TEvent[TDiscriminator],
>(
    discriminator: TDiscriminator,
    type: TType,
    subscriber: EventSubscriber<Extract<TEvent, Record<TDiscriminator, TType>>>,
): EventSubscriber<TEvent> {
    return async (event: TEvent) => {
        if (event[discriminator] === type) {
            await subscriber(event as Extract<TEvent, Record<TDiscriminator, TType>>)
        }
    }
}

/**
 * Combines multiple unsubscribe functions into a single function that calls all of them.
 *
 * @param unsubscribers The unsubscribers to combine.
 * @returns An unsubscribe function that calls all the provided unsubscribers.
 */
export function combineUnsubscribers(...unsubscribers: EventUnsubscriber[]): EventUnsubscriber {
    return () => {
        for (const unsubscribe of unsubscribers) {
            unsubscribe()
        }
    }
}
