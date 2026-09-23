import z4 from "zod/v4"

import { RPCTransportMessage, type RPCTransport } from "../transport"

const HandshakeRequest = z4.object({
    /** The type of the message */
    type: z4.literal("handshakeRequest"),

    /** The identity of the iframe's content */
    identity: z4.string(),
})

const HandshakeResponse = z4.object({
    /** The type of the message */
    type: z4.literal("handshakeResponse"),
})

/**
 * Whether a message event came from the window it is expected from.
 *
 * Checking the source as well as the origin matters because two documents
 * from the same origin, such as two iframes of the same extension, would
 * otherwise be indistinguishable.
 */
function isMessageFrom(event: MessageEvent, source: Window | null, origin: string): boolean {
    return source !== null && event.source === source && event.origin === origin
}

export interface MessageChannelResponderOptions {
    /** The iframe element to establish connections with */
    readonly iframe: HTMLIFrameElement

    /** The origin of the iframe's content window */
    readonly origin: string

    /** The expected identity of the iframe's content */
    readonly identity: string
}

export interface MessageChannelResponderNextOptions {
    /**
     * How long to wait for a handshake request before timing out,
     * in milliseconds. Waits indefinitely when omitted.
     */
    readonly timeout?: number
}

interface PendingNext {
    readonly resolve: (transport: MessageChannelTransport | null) => void
    readonly reject: (reason: unknown) => void
    readonly timeoutId: ReturnType<typeof setTimeout> | null
}

/**
 * Answers handshake requests from an iframe for as long as it is open.
 *
 * An iframe's document sends a handshake request every time it starts,
 * which includes reloads, so a responder outlives any one connection and
 * hands out a fresh transport for each request it answers.
 */
export class MessageChannelResponder {
    private readonly _options: MessageChannelResponderOptions
    private readonly _queued: MessageChannelTransport[]
    private _pending: PendingNext | null
    private _isOpen: boolean

    constructor(options: MessageChannelResponderOptions) {
        this._options = options
        this._queued = []
        this._pending = null
        this._isOpen = true
        window.addEventListener("message", this._handleMessage)
    }

    private readonly _handleMessage = (event: MessageEvent) => {
        const { iframe, origin, identity } = this._options
        if (!isMessageFrom(event, iframe.contentWindow, origin)) {
            return
        }
        const request = HandshakeRequest.safeParse(event.data)
        if (!request.success) {
            return
        }
        if (request.data.identity !== identity) {
            this._fail(new Error("Identity mismatch"))
            return
        }

        const channels = MessageChannelTransport.createChannels()
        const transport = new MessageChannelTransport(
            channels.localPorts.send,
            channels.localPorts.receive,
        )
        iframe.contentWindow?.postMessage(
            HandshakeResponse.parse({
                type: "handshakeResponse",
            }),
            origin,
            [channels.remotePorts.send, channels.remotePorts.receive],
        )
        this._deliver(transport)
    }

    private _deliver(transport: MessageChannelTransport) {
        const pending = this._takePending()
        if (pending !== null) {
            pending.resolve(transport)
        } else {
            this._queued.push(transport)
        }
    }

    private _fail(error: Error) {
        const pending = this._takePending()
        if (pending !== null) {
            pending.reject(error)
        } else {
            console.error("*** Ignoring handshake request", error)
        }
    }

    private _takePending(): PendingNext | null {
        const pending = this._pending
        if (pending !== null) {
            this._pending = null
            if (pending.timeoutId !== null) {
                clearTimeout(pending.timeoutId)
            }
        }
        return pending
    }

    /**
     * Wait for the next connection from the iframe.
     *
     * @returns A transport for the connection, or `null` once the responder is closed.
     */
    next({
        timeout,
    }: MessageChannelResponderNextOptions = {}): Promise<MessageChannelTransport | null> {
        if (!this._isOpen) {
            return Promise.resolve(null)
        }
        const queued = this._queued.shift()
        if (queued !== undefined) {
            return Promise.resolve(queued)
        }
        if (this._pending !== null) {
            return Promise.reject(new Error("Already waiting for a connection"))
        }
        return new Promise((resolve, reject) => {
            const timeoutId =
                timeout === undefined
                    ? null
                    : setTimeout(() => {
                          this._pending = null
                          reject(new Error("Handshake timeout"))
                      }, timeout)
            this._pending = { resolve, reject, timeoutId }
        })
    }

    /**
     * Stop answering requests, releasing any connections nobody has claimed.
     */
    close(): void {
        if (!this._isOpen) {
            return
        }
        this._isOpen = false
        window.removeEventListener("message", this._handleMessage)
        for (const transport of this._queued.splice(0)) {
            transport.invalidate()
        }
        this._takePending()?.resolve(null)
    }
}

function waitForHandshakeResponse(
    parentWindow: Window,
    origin: string,
    timeout: number,
): Promise<MessageEvent> {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            window.removeEventListener("message", handleMessage)
            reject(new Error("Handshake timeout"))
        }, timeout)
        const handleMessage = (event: MessageEvent) => {
            if (!isMessageFrom(event, parentWindow, origin)) {
                return
            }
            if (!HandshakeResponse.safeParse(event.data).success) {
                return
            }
            clearTimeout(timeoutId)
            window.removeEventListener("message", handleMessage)
            resolve(event)
        }
        window.addEventListener("message", handleMessage)
    })
}

export interface MessageChannelTransportHandshakeOptions {
    /** The parent window to establish a connection with */
    readonly parentWindow: Window

    /** The origin of the parent window */
    readonly origin: string

    /** The identity of the iframe's content */
    readonly identity: string

    /** How long to wait for a handshake response before timing out */
    readonly timeout: number
}

export class MessageChannelTransport implements RPCTransport {
    static createChannels() {
        const localChannel = new MessageChannel()
        const remoteChannel = new MessageChannel()
        return {
            localPorts: { send: localChannel.port1, receive: remoteChannel.port1 },
            remotePorts: { send: remoteChannel.port2, receive: localChannel.port2 },
        }
    }

    /**
     * Start answering handshake requests from an iframe.
     *
     * Unlike a one-off handshake, the responder keeps answering for as long
     * as it is open, so an iframe which reloads can connect again.
     */
    static listen(options: MessageChannelResponderOptions): MessageChannelResponder {
        return new MessageChannelResponder(options)
    }

    /**
     * Ask the parent window for a connection from inside an iframe,
     * establishing a message channel transport between them.
     */
    static async handshake(
        options: MessageChannelTransportHandshakeOptions,
    ): Promise<MessageChannelTransport> {
        const pendingEvent = waitForHandshakeResponse(
            options.parentWindow,
            options.origin,
            options.timeout,
        )
        options.parentWindow.postMessage(
            HandshakeRequest.parse({
                type: "handshakeRequest",
                identity: options.identity,
            }),
            options.origin,
        )
        const event = await pendingEvent
        if (event.ports.length !== 2) {
            throw new Error("Handshake received but wrong number of ports given")
        }
        return new MessageChannelTransport(event.ports[0], event.ports[1])
    }

    constructor(
        private readonly sendPort: MessagePort,
        private readonly receivePort: MessagePort,
    ) {
        this.onmessage = null
        this.receivePort.onmessage = (event) => {
            this.handleMessage(event)
        }
    }

    private async handleMessage(event: MessageEvent): Promise<void> {
        try {
            const reply = RPCTransportMessage.parse(event.data)
            this.onmessage?.(reply)
        } catch (error) {
            console.error("*** Could not handle message", error, event)
        }
    }

    onmessage: ((reply: RPCTransportMessage) => void) | null

    postMessage(message: RPCTransportMessage): void {
        this.sendPort.postMessage(message)
    }

    invalidate(): void {
        this.sendPort.close()
        this.receivePort.close()
        this.receivePort.onmessage = null
        this.onmessage = null
    }
}
