import type { RPCTransport, RPCTransportMessage, RPCTransportReply } from "@/transport"

import { findExportedObject, type RPCObjectExport } from "@/export"

function jsonify<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
}

export class DummyTransport implements RPCTransport {
    /** The root of the exported object tree */
    private readonly _root: RPCObjectExport

    constructor(root: RPCObjectExport) {
        this._root = root
    }

    async send(message: RPCTransportMessage): Promise<RPCTransportReply> {
        try {
            const sanitizedMessage = jsonify(message)
            const object = findExportedObject(this._root, sanitizedMessage.path)
            if (object === null) {
                throw new Error(`Target ${sanitizedMessage.path} not found`)
            }
            switch (sanitizedMessage.type) {
                case "object.conformsToProtocol":
                    return jsonify({
                        type: "object.conformsToProtocol",
                        conforms: await object.conformsToProtocol(sanitizedMessage.protocolName),
                    })
                case "object.invoke":
                    return jsonify({
                        type: "object.invoke",
                        result: await object.invoke(
                            sanitizedMessage.protocolName,
                            sanitizedMessage.selector,
                            sanitizedMessage.parameters,
                        ),
                    })
                default:
                    throw new Error(`Unknown message type`)
            }
        } catch (error) {
            return jsonify({
                type: "error",
                name: error instanceof Error ? error.name : "UnknownError",
                message: error instanceof Error ? error.message : String(error),
            })
        }
    }
}
