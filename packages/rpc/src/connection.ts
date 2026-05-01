import type { RPCObject } from "./object"
import type { ProtocolImplementation } from "./protocol"
import type { RPCCommand, RPCCommandResult, RPCTransport, RPCTransportMessage } from "./transport"

import { RPCBroadcaster } from "./broadcaster"
import { LocalObject } from "./internal/localObject"
import { RemoteObject } from "./internal/remoteObject"
import { assertNever } from "./internal/utilities"

async function dispatchCommand(command: RPCCommand, object: RPCObject): Promise<RPCCommandResult> {
    try {
        switch (command.type) {
            case "object.getProtocolNames":
                return {
                    type: "object.getProtocolNames",
                    protocolNames: await object.getProtocolNames(),
                }
            case "object.implementsProtocol":
                return {
                    type: "object.implementsProtocol",
                    conforms: await object.implementsProtocol(command.protocolName),
                }
            case "object.invoke":
                return {
                    type: "object.invoke",
                    result: await object.invoke(
                        command.protocolName,
                        command.selector,
                        command.parameters,
                    ),
                }
            default:
                throw new Error(`Unknown message type`)
        }
    } catch (error) {
        return {
            type: "error",
            name: error instanceof Error ? error.name : "UnknownError",
            message: error instanceof Error ? error.message : String(error),
        }
    }
}

function isCommandResultOfType<Type extends RPCCommandResult["type"]>(
    reply: RPCCommandResult,
    type: Type,
): reply is Extract<RPCCommandResult, { type: Type }> {
    return reply.type === type
}

interface PendingSend {
    readonly resolve: (value: RPCCommandResult) => void
    readonly reject: (reason?: unknown) => void
}

export interface RPCConnectionOptions {
    /** The transport the connection will use to communicate with the remote object */
    readonly transport: RPCTransport

    /** The object that will be exported to the remote side */
    readonly exportedObject: readonly ProtocolImplementation[]

    /** The capabilities of the connection, usable for permissions and feature detection */
    readonly capabilities?: Record<string, unknown>

    /** The broadcast to use for this connection */
    readonly broadcaster?: RPCBroadcaster
}

export class RPCConnectionInvalidatedEvent extends Event {
    constructor(eventInit?: EventInit) {
        super("invalidated", eventInit)
    }
}

interface RPCConnectionEventMap {
    invalidated: RPCConnectionInvalidatedEvent
}

export class RPCConnection extends EventTarget {
    /**
     * Tracks the current RPC connection, if any.
     */
    private static _current: RPCConnection | null = null

    /**
     * Executes the given function with the given connection as the current connection.
     */
    private static _withCurrent<T>(
        current: RPCConnection,
        fn: (current: RPCConnection | null) => T,
    ): T {
        const previous = RPCConnection._current
        RPCConnection._current = current
        try {
            return fn(previous)
        } finally {
            RPCConnection._current = previous
        }
    }

    /**
     * Returns the current RPC connection, if any.
     */
    static get current(): RPCConnection | null {
        return RPCConnection._current
    }

    constructor(options: RPCConnectionOptions) {
        super()

        this._isValid = true
        this.pending = new Map<string, PendingSend>()
        this.transport = options.transport
        this.broadcaster = options.broadcaster ?? new RPCBroadcaster()
        this.capabilities = options.capabilities ?? {}
        this.exportedObject = new LocalObject(options.exportedObject)
        this.remoteObject = new RemoteObject(async (command) => {
            const reply = await this.send(command)
            if (isCommandResultOfType(reply, "error")) {
                throw new Error(reply.message)
            }
            if (!isCommandResultOfType(reply, command.type)) {
                throw new Error(`Reply to ${command.type} message was mismatched ${reply.type}`)
            }
            return reply
        })

        this.broadcaster.onsend = (what, topic, data) => {
            this.transport.postMessage({ type: "broadcast", what, topic, data })
        }
        this.transport.onmessage = (reply) => {
            this.handleMessage(reply)
        }
    }

    /** Read/write backing for public isValid property */
    private _isValid: boolean

    /** Tracks all pending commands that have been sent but not yet received a reply */
    private readonly pending: Map<string, PendingSend>

    /** The transport the connection will use to communicate with the remote object */
    private readonly transport: RPCTransport

    /** The broadcaster forwarded to the remote side of the connection */
    public readonly broadcaster: RPCBroadcaster

    /** The capabilities of the connection, usable for permissions and feature detection */
    public readonly capabilities: Record<string, unknown>

    /** The object exported by this side of the connection */
    public readonly exportedObject: RPCObject

    /** The object exported by the remote side of the connection */
    public readonly remoteObject: RPCObject

    /** Returns true if the connection is valid (i.e. the transport is connected) */
    public get isValid(): boolean {
        return this._isValid
    }

    /**
     * Handles a message from the remote side of the connection.
     */
    private async handleMessage(message: RPCTransportMessage): Promise<void> {
        await RPCConnection._withCurrent(this, async () => {
            switch (message.type) {
                case "command": {
                    const result = await dispatchCommand(message.command, this.exportedObject)
                    this.transport.postMessage({ id: message.id, type: "result", result })
                    break
                }
                case "result": {
                    const pending = this.pending.get(message.id)
                    if (pending) {
                        pending.resolve(message.result)
                        this.pending.delete(message.id)
                    }
                    break
                }
                case "broadcast": {
                    this.broadcaster.receive(this, message.what, message.topic, message.data)
                    break
                }
                default: {
                    assertNever(message)
                }
            }
        })
    }

    /**
     * Send a command to the remote side of the connection.
     *
     * @param command The command to send.
     * @returns A promise that resolves with the result of the command.
     */
    private async send(command: RPCCommand): Promise<RPCCommandResult> {
        if (!this._isValid) {
            throw new Error("Connection is invalid")
        }
        const id = crypto.randomUUID()
        const reply = new Promise<RPCCommandResult>((resolve, reject) => {
            this.pending.set(id, { resolve, reject })
        })
        this.transport.postMessage({ id, type: "command", command })
        return await reply
    }

    /**
     * Invalidate the connection, rejecting all pending commands and clearing the transport.
     */
    invalidate(): void {
        if (!this._isValid) {
            return
        }

        this.transport.invalidate()
        this.broadcaster.invalidate()

        for (const [_, pending] of this.pending) {
            pending.reject(new Error("Connection invalidated"))
        }
        this.pending.clear()

        this._isValid = false

        this.dispatchEvent(new RPCConnectionInvalidatedEvent())
    }

    addEventListener<K extends keyof RPCConnectionEventMap>(
        type: K,
        listener: (this: RPCConnection, ev: RPCConnectionEventMap[K]) => any,
        options?: AddEventListenerOptions | boolean,
    ): void
    override addEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: AddEventListenerOptions | boolean,
    ): void {
        super.addEventListener(type, callback, options)
    }

    removeEventListener<K extends keyof RPCConnectionEventMap>(
        type: K,
        listener: (this: RPCConnection, ev: RPCConnectionEventMap[K]) => any,
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
