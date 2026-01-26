import type { RPCObject } from "@/base/object"
import type { Transport, TransportMessage, TransportReply } from "@/remote/transport"

function sanitize<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
}

export class DummyTransport implements Transport {
    private readonly root: RPCObject

    constructor(root: RPCObject) {
        this.root = root
    }

    async send(message: TransportMessage): Promise<TransportReply> {
        try {
            const sanitizedMessage = sanitize(message)
            const target = await this.root.find(sanitizedMessage.target)
            if (target === null) {
                throw new Error(`Target ${sanitizedMessage.target} not found`)
            }
            switch (sanitizedMessage.type) {
                case "object.getName":
                    return sanitize({ type: "object.getName", name: await target.getName() })
                case "object.inspect":
                    return sanitize({
                        type: "object.inspect",
                        addresses: await target.inspect(sanitizedMessage.options),
                    })
                case "object.find":
                    return sanitize({
                        type: "object.find",
                        exists: !!(await target.find(sanitizedMessage.address)),
                    })
                case "object.conformsToProtocol":
                    return sanitize({
                        type: "object.conformsToProtocol",
                        conforms: await target.conformsToProtocol(sanitizedMessage.name),
                    })
                case "object.invoke":
                    return {
                        type: "object.invoke",
                        result: sanitize(
                            await target.invoke(
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
                message: error instanceof Error ? error.message : String(error),
            })
        }
    }
}
