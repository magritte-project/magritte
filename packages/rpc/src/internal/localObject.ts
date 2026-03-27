import type { RPCObject } from "../object"
import type { ProtocolImplementation } from "../protocol"

export class LocalObject implements RPCObject {
    private readonly protocols: ReadonlyMap<string, ProtocolImplementation>

    constructor(protocols: readonly ProtocolImplementation[]) {
        this.protocols = new Map(protocols.map((protocol) => [protocol.name, protocol]))
    }

    async getProtocolNames(): Promise<string[]> {
        return Array.from(this.protocols.keys())
    }

    async implementsProtocol(protocolName: string): Promise<boolean> {
        return this.protocols.has(protocolName)
    }

    async invoke(protocolName: string, selector: string, parameters: unknown): Promise<unknown> {
        const protocol = this.protocols.get(protocolName)
        if (protocol === undefined) {
            throw new Error(`Protocol ${protocolName} not found`)
        }
        const implementation = protocol.vtable[selector]
        if (implementation === undefined) {
            throw new Error(`Selector ${selector} not implemented by ${protocolName}`)
        }
        return await implementation.call(protocol, parameters)
    }
}
