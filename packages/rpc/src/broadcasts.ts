import z4 from "zod/v4"

/**
 * Defines a broadcast which can be sent over an {@link RPCConnection}.
 */
export interface RPCBroadcastDefinition<TWhat extends string, TData extends z4.ZodType> {
    /**
     * The channel on which the broadcast is sent.
     * Typically this is the name of a protocol.
     *
     * Note: All channels beginning with a `.`
     * are reserved for internal use.
     */
    readonly channel: string

    /**
     * The type of the broadcast. Typically the name of an event.
     */
    readonly what: TWhat

    /**
     * The schema of data sent with the broadcast.
     */
    readonly data: TData
}

/**
 * Create a broadcast definition for use with {@link RPCBroadcaster}.
 *
 * Usage:
 * ```typescript
 * const ArithmeticAdded = defineBroadcast("Arithmetic", "added", z4.number())
 * ```
 *
 * @param channel The channel on which the broadcast is sent.
 * Typically this is the name of a protocol.
 * @param what The type of the broadcast. Typically the name of an event.
 * @param data The schema of data sent with the broadcast.
 * @returns A broadcast definition.
 */
export function defineBroadcast<const TWhat extends string, TData extends z4.ZodType>(
    channel: string,
    what: TWhat,
    data: TData,
): RPCBroadcastDefinition<TWhat, TData> {
    return {
        channel,
        what,
        data,
    }
}

/**
 * A subscription to broadcasts.
 *
 * Note: All subscriptions are automatically unsubscribed
 * when a broadcaster is invalidated. Subscriptions may be
 * safely discarded unless a subscriber's lifecycle is not
 * tied only to the broadcaster's lifecycle.
 */
export interface RPCBroadcastSubscription {
    /** Unsubscribes the subscriber from the broadcaster */
    unsubscribe: () => void
}

export class RPCBroadcaster {
    /**
     * Signals when a broadcaster is itself invalidated.
     */
    static readonly invalidated = defineBroadcast(".RPCBroadcaster", "invalidated", z4.void())

    /** Tracks subscriptions to this broadcaster */
    private readonly _subscriptions: Map<string, ((data: unknown) => void)[]>

    /** Tracks whether this broadcaster has been invalidated */
    private _hasInvalidated: boolean

    /** Construct a broadcaster */
    constructor() {
        this._subscriptions = new Map()
        this._hasInvalidated = false
    }

    /** Returns the key used to track subscribers for a given channel/what pair */
    private _subscribersKeyFor(channel: string, what: string): string {
        return `${channel}.${what}`
    }

    /** Returns the subscribers for a given channel/what pair, creating a new array if none exist */
    private _subscribersFor(channel: string, what: string): ((data: unknown) => void)[] {
        const subscribersKey = this._subscribersKeyFor(channel, what)
        let subscribers = this._subscriptions.get(subscribersKey)
        if (!subscribers) {
            subscribers = []
            this._subscriptions.set(subscribersKey, subscribers)
        }
        return subscribers
    }

    /** Indicates whether this broadcaster is valid */
    get isValid(): boolean {
        return !this._hasInvalidated
    }

    /**
     * Invalidate this broadcaster, first sending an `invalidated` broadcast, then clearing all subscriptions.
     */
    invalidate(): void {
        if (this._hasInvalidated) {
            return
        }
        this._connection_receive(
            RPCBroadcaster.invalidated.channel,
            RPCBroadcaster.invalidated.what,
            undefined,
        )
        this._subscriptions.clear()
        this._hasInvalidated = true
    }

    /**
     * @private
     *
     * Called to handle a broadcast being sent. This should only be set by `RPCConnection`.
     */
    _connection_onsend: ((channel: string, what: string, data: unknown) => void) | undefined

    /**
     * Send a broadcast to the remote side of a connection.
     *
     * @param definition The definition of the broadcast to send.
     * @param data Optional data to send with the broadcast.
     */
    send<const TWhat extends string, TData extends z4.ZodType>(
        definition: RPCBroadcastDefinition<TWhat, TData>,
        data: z4.infer<TData>,
    ): void {
        if (!this.isValid || this._connection_onsend === undefined) {
            throw new Error("Broadcaster is invalid")
        }
        this._connection_onsend(
            definition.channel,
            definition.what,
            z4.parse(definition.data, data),
        )
    }

    /**
     * @private
     *
     * Receive a broadcast from the remote side of a connection.
     *
     * This method should only be called by `RPCConnection`.
     *
     * @param channel The channel the broadcast was sent on.
     * @param what What was broadcast.
     * @param data Data received with the broadcast.
     */
    _connection_receive(channel: string, what: string, data: unknown): void {
        if (!this.isValid) {
            throw new Error("Broadcaster is invalid")
        }
        const subscribersKey = this._subscribersKeyFor(channel, what)
        const subscribers = this._subscriptions.get(subscribersKey)
        if (subscribers === undefined) {
            return
        }
        for (const subscriber of subscribers) {
            try {
                subscriber(data)
            } catch (error) {
                console.error("*** Discarding error thrown by subscriber", subscribersKey, error)
            }
        }
    }

    /**
     * Subscribe to a broadcast on this broadcaster.
     *
     * @param definition The definition of the broadcast to subscribe to.
     * @param callback The callback to invoke when the broadcast is received.
     * @returns A subscription object that can be used to unsubscribe.
     */
    subscribe<const TWhat extends string, TData extends z4.ZodType>(
        definition: RPCBroadcastDefinition<TWhat, TData>,
        callback: (data: z4.infer<TData>) => void,
    ): RPCBroadcastSubscription {
        if (!this.isValid) {
            throw new Error("Broadcaster is invalid")
        }
        const subscribers = this._subscribersFor(definition.channel, definition.what)
        const subscriber = (data: unknown) => callback(z4.parse(definition.data, data))
        subscribers.push(subscriber)
        return {
            unsubscribe: () => {
                const toRemove = subscribers.indexOf(subscriber)
                if (toRemove !== -1) {
                    subscribers.splice(toRemove, 1)
                }
            },
        }
    }
}
