import z4 from "zod/v4"

import { findExportedObject, type RPCObjectExport } from "@/export"
import {
    RPCTransportMessageSchema,
    RPCTransportReplySchema,
    type RPCTransport,
    type RPCTransportMessage,
    type RPCTransportReply,
} from "@/transport"

const wireSchema = z4.object({
    id: z4.string(),
    data: z4.union([
        z4.object({
            type: z4.literal("message"),
            message: RPCTransportMessageSchema,
        }),
        z4.object({
            type: z4.literal("reply"),
            reply: RPCTransportReplySchema,
        }),
    ]),
})

interface PendingSend {
    readonly resolve: (value: RPCTransportReply) => void
    readonly reject: (reason?: unknown) => void
}

export class MessageChannelTransport implements RPCTransport {
    /** The root of the exported object tree */
    private readonly _root: RPCObjectExport

    /** The remote port of the message channel */
    private readonly _remotePort: MessagePort

    /** The local port of the message channel */
    private readonly _localPort: MessagePort

    /** The pending sends, keyed by request ID */
    private readonly _pending: Map<string, PendingSend>

    constructor(root: RPCObjectExport, remotePort: MessagePort, localPort: MessagePort) {
        this._root = root
        this._remotePort = remotePort
        this._localPort = localPort
        this._pending = new Map()

        this._localPort.onmessage = (event) => {
            this._handleMessage(event)
        }
    }

    private _postMessage(message: z4.infer<typeof wireSchema>) {
        this._remotePort.postMessage(message)
    }

    private async _handleMessage(event: MessageEvent): Promise<void> {
        try {
            const { id, data } = wireSchema.parse(event.data)
            switch (data.type) {
                case "message":
                    try {
                        const object = findExportedObject(this._root, data.message.path)
                        if (object === null) {
                            throw new Error(`Target ${data.message.path} not found`)
                        }
                        switch (data.message.type) {
                            case "object.conformsToProtocol":
                                this._postMessage({
                                    id,
                                    data: {
                                        type: "reply",
                                        reply: {
                                            type: "object.conformsToProtocol",
                                            conforms: await object.conformsToProtocol(
                                                data.message.protocolName,
                                            ),
                                        },
                                    },
                                })
                                break
                            case "object.invoke":
                                this._postMessage({
                                    id,
                                    data: {
                                        type: "reply",
                                        reply: {
                                            type: "object.invoke",
                                            result: await object.invoke(
                                                data.message.protocolName,
                                                data.message.selector,
                                                data.message.parameters,
                                            ),
                                        },
                                    },
                                })
                                break
                            default:
                                throw new Error(`Unknown message type`)
                        }
                    } catch (error) {
                        this._postMessage({
                            id,
                            data: {
                                type: "reply",
                                reply: {
                                    type: "error",
                                    name: error instanceof Error ? error.name : "UnknownError",
                                    message: error instanceof Error ? error.message : String(error),
                                },
                            },
                        })
                    }
                    break
                case "reply":
                    const pending = this._pending.get(id)
                    if (pending) {
                        pending.resolve(data.reply)
                        this._pending.delete(id)
                    }
                    break
            }
        } catch (error) {
            console.error("*** Could not handle message", error, event)
        }
    }

    async send(message: RPCTransportMessage): Promise<RPCTransportReply> {
        const id = crypto.randomUUID()
        const reply = new Promise<RPCTransportReply>((resolve, reject) => {
            this._pending.set(id, { resolve, reject })
        })
        this._postMessage({ id, data: { type: "message", message } })
        return await reply
    }
}
