import type { RPCObject } from "./object.js"

import { send, type RPCTransport } from "./transport.js"

export class RemoteObject implements RPCObject {
    private readonly transport: RPCTransport
    private readonly path: readonly string[]

    constructor(transport: RPCTransport, path: readonly string[]) {
        this.transport = transport
        this.path = path
    }

    async conformsToProtocol(protocolName: string): Promise<boolean> {
        const reply = await send(this.transport, {
            type: "object.conformsToProtocol",
            path: this.path,
            protocolName,
        })
        return reply.conforms
    }

    async invoke(protocolName: string, selector: string, parameters: unknown): Promise<unknown> {
        const reply = await send(this.transport, {
            type: "object.invoke",
            path: this.path,
            protocolName,
            selector,
            parameters,
        })
        return reply.result
    }
}
