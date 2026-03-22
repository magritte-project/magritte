import type { RPCTransport, RPCTransportMessage, RPCTransportReply } from "@/transport"

import { findExportedObject, type RPCObjectExport } from "@/export"

function sanitize<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
}

export class DummyTransport implements RPCTransport {
    private readonly root: RPCObjectExport

    constructor(root: RPCObjectExport) {
        this.root = root
    }

    async send(message: RPCTransportMessage): Promise<RPCTransportReply> {
        try {
            const sanitizedMessage = sanitize(message)
            const object = findExportedObject(this.root, sanitizedMessage.path)
            if (object === null) {
                throw new Error(`Target ${sanitizedMessage.path} not found`)
            }
            switch (sanitizedMessage.type) {
                case "object.conformsToProtocol":
                    return sanitize({
                        type: "object.conformsToProtocol",
                        conforms: await object.conformsToProtocol(sanitizedMessage.protocolName),
                    })
                case "object.invoke":
                    return {
                        type: "object.invoke",
                        result: sanitize(
                            await object.invoke(
                                sanitizedMessage.protocolName,
                                sanitizedMessage.selector,
                                sanitizedMessage.parameters,
                            ),
                        ),
                    }
                default:
                    throw new Error(`Unknown message type`)
            }
        } catch (error) {
            return sanitize({
                type: "error",
                name: error instanceof Error ? error.name : "UnknownError",
                message: error instanceof Error ? error.message : String(error),
            })
        }
    }
}
