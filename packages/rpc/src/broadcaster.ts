import type { RPCConnection } from "./connection"

export class RPCInvalidatedBroadcastEvent extends Event {
    constructor(eventInit?: EventInit) {
        super("invalidated", eventInit)
    }
}

export class RPCIncomingBroadcastEvent extends Event {
    constructor(
        readonly connection: RPCConnection,
        readonly what: string,
        readonly topic: string,
        readonly data: Record<string, string | undefined> | undefined,
        eventInitDict?: EventInit,
    ) {
        super("incomingBroadcast", eventInitDict)
    }
}

interface RPCBroadcasterEventMap {
    invalidated: RPCInvalidatedBroadcastEvent
    incomingBroadcast: RPCIncomingBroadcastEvent
}

export class RPCBroadcaster extends EventTarget {
    private _isValid: boolean

    constructor() {
        super()

        this._isValid = true
    }

    get isValid(): boolean {
        return this._isValid
    }

    invalidate(): void {
        if (!this._isValid) {
            return
        }

        this._isValid = false
        this.dispatchEvent(new RPCInvalidatedBroadcastEvent())
    }

    /**
     * @private
     *
     * Called to handle a broadcast being sent. This should only be set by `RPCConnection`.
     */
    onsend:
        | ((what: string, topic: string, data?: Record<string, string | undefined>) => void)
        | undefined

    /**
     * Send a broadcast to the remote side of a connection.
     *
     * @param what What's being broadcast.
     * @param topic What topic the broadcast is being sent on.
     * @param data Optional data to send with the broadcast.
     */
    send(what: string, topic: string, data?: Record<string, string | undefined>): void {
        if (!this._isValid) {
            throw new Error("Broadcaster is invalid")
        }
        this.onsend?.(what, topic, data)
    }

    /**
     * @private
     *
     * Receive a broadcast from the remote side of a connection.
     *
     * This method should only be called by `RPCConnection`.
     *
     * @param connection The connection that received the broadcast.
     * @param what What was broadcast.
     * @param topic What topic the broadcast was sent on.
     * @param data Optional data received with the broadcast.
     */
    receive(
        connection: RPCConnection,
        what: string,
        topic: string,
        data: Record<string, string | undefined> | undefined,
    ): void {
        if (!this._isValid) {
            throw new Error("Broadcaster is invalid")
        }
        this.dispatchEvent(new RPCIncomingBroadcastEvent(connection, what, topic, data))
    }

    addEventListener<K extends keyof RPCBroadcasterEventMap>(
        type: K,
        listener: (this: RPCBroadcaster, ev: RPCBroadcasterEventMap[K]) => any,
        options?: AddEventListenerOptions | boolean,
    ): void
    addEventListener(
        type: string,
        listener: null,
        options?: AddEventListenerOptions | boolean,
    ): void
    override addEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: AddEventListenerOptions | boolean,
    ): void {
        super.addEventListener(type, callback, options)
    }

    removeEventListener<K extends keyof RPCBroadcasterEventMap>(
        type: K,
        listener: (this: RPCBroadcaster, ev: RPCBroadcasterEventMap[K]) => any,
        options?: AddEventListenerOptions | boolean,
    ): void
    removeEventListener(
        type: string,
        listener: null,
        options?: AddEventListenerOptions | boolean,
    ): void
    override removeEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean,
    ): void {
        super.removeEventListener(type, callback, options)
    }
}
