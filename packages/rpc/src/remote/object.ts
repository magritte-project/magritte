import type { PRCObjectAddress, RPCObject, RPCObjectInspectOptions } from "@/base/object"

import { send, type Transport } from "@/remote/transport"

export class RemoteObject implements RPCObject {
    private readonly transport: Transport
    private readonly target: PRCObjectAddress

    constructor(transport: Transport, target: PRCObjectAddress) {
        this.transport = transport
        this.target = target
    }

    async getName(): Promise<string> {
        const reply = await send(this.transport, {
            type: "object.getName",
            target: this.target,
        })
        return reply.name
    }

    async inspect(options: RPCObjectInspectOptions = {}): Promise<readonly PRCObjectAddress[]> {
        const reply = await send(this.transport, {
            type: "object.inspect",
            target: this.target,
            options,
        })
        return reply.addresses
    }

    async find(address: PRCObjectAddress): Promise<RPCObject | null> {
        const reply = await send(this.transport, {
            type: "object.find",
            target: this.target,
            address,
        })
        if (reply.exists) {
            return new RemoteObject(this.transport, address)
        } else {
            return null
        }
    }

    async conformsToProtocol(name: string): Promise<boolean> {
        const reply = await send(this.transport, {
            type: "object.conformsToProtocol",
            target: this.target,
            name,
        })
        return reply.conforms
    }

    async invoke(protocolName: string, selector: string, parameters: unknown): Promise<unknown> {
        const reply = await send(this.transport, {
            type: "object.invoke",
            target: this.target,
            protocolName,
            selector,
            parameters,
        })
        return reply.result
    }
}
