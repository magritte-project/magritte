import { RPCBroadcaster } from "./broadcasts"
import { Local } from "./internal/local"
import { LocalObject } from "./internal/localObject"
import { RemoteObject } from "./internal/remoteObject"
import { assertNever } from "./internal/utilities"
import type { RPCObject } from "./object"
import type { ProtocolImplementation } from "./protocol"
import type { RPCCommand, RPCCommandResult, RPCTransport, RPCTransportMessage } from "./transport"

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

    /** The broadcast to use for this connection */
    readonly broadcaster?: RPCBroadcaster

    /** The default timeout for remote operations, in milliseconds  */
    readonly timeout?: number
}

export type RPCConnectionEvent = { type: "timeout" } | { type: "invalidated" }

export class RPCConnection {
    /**
     * Tracks the current RPC connection, if any.
     */
    private static readonly $current = new Local<RPCConnection | null>(null)

    /**
     * Returns the current RPC connection, if any.
     */
    static get current(): RPCConnection | null {
        return RPCConnection.$current.value
    }

    constructor(options: RPCConnectionOptions) {
        this.subscribers = []
        this._isValid = true
        this.$timeout = new Local(options.timeout ?? 7_000)
        this.pending = new Map<string, PendingSend>()
        this.transport = options.transport
        this.broadcaster = options.broadcaster ?? new RPCBroadcaster()
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

        this.broadcaster._connection_onsend = (channel, what, data) => {
            this.transport.postMessage({ type: "broadcast", channel, what, data })
        }
        this.transport.onmessage = (reply) => {
            this.handleMessage(reply)
        }
    }

    /** The event subscribers for the connection */
    private readonly subscribers: ((event: RPCConnectionEvent) => void)[]

    /** Read/write backing for public isValid property */
    private _isValid: boolean

    /** Backing for the timeout property */
    private readonly $timeout: Local<number>

    /** Tracks all pending commands that have been sent but not yet received a reply */
    private readonly pending: Map<string, PendingSend>

    /** The transport the connection will use to communicate with the remote object */
    private readonly transport: RPCTransport

    /** The broadcaster forwarded to the remote side of the connection */
    public readonly broadcaster: RPCBroadcaster

    /** The object exported by this side of the connection */
    public readonly exportedObject: RPCObject

    /** The object exported by the remote side of the connection */
    public readonly remoteObject: RPCObject

    /** Returns true if the connection is valid (i.e. the transport is connected) */
    public get isValid(): boolean {
        return this._isValid
    }

    /** The current timeout value in milliseconds */
    public get timeout(): number {
        return this.$timeout.value
    }

    /**
     * Set the timeout for a given remote operation.
     *
     * @param timeout The timeout value in milliseconds.
     * @param operation The operation to perform with the given timeout.
     * @returns The result of the operation.
     */
    async withTimeout<R>(timeout: number, operation: () => Promise<R>): Promise<R> {
        return this.$timeout.withValueAsync(timeout, operation)
    }

    /**
     * Handles a message from the remote side of the connection.
     */
    private async handleMessage(message: RPCTransportMessage): Promise<void> {
        await RPCConnection.$current.withValueAsync(this, async () => {
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
                    this.broadcaster._connection_receive(
                        message.channel,
                        message.what,
                        message.data,
                    )
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
        const reply = new Promise<RPCCommandResult>(($resolve, $reject) => {
            const timeoutId = setTimeout(() => {
                $reject(new Error("Operation timed out"))
                this.pending.delete(id)
                this._dispatch({ type: "timeout" })
            }, this.timeout)
            this.pending.set(id, {
                resolve: (result) => {
                    clearTimeout(timeoutId)
                    $resolve(result)
                },
                reject: (reason?: unknown) => {
                    clearTimeout(timeoutId)
                    $reject(reason)
                },
            })
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

        this._dispatch({ type: "invalidated" })
    }

    private _dispatch(event: RPCConnectionEvent) {
        for (const subscriber of this.subscribers.slice()) {
            try {
                subscriber(event)
            } catch (error) {
                console.error(`*** Unhandled error in RPC connection event subscriber`, error)
            }
        }
    }

    subscribe(subscriber: (event: RPCConnectionEvent) => void): () => void {
        this.subscribers.push(subscriber)
        return () => {
            const toRemove = this.subscribers.indexOf(subscriber)
            if (toRemove !== -1) {
                this.subscribers.splice(toRemove, 1)
            }
        }
    }
}
