import type { RPCObject } from "./object.js"
import type { ProtocolImplementation } from "./protocol.js"

export class LocalObject implements RPCObject {
    private readonly name: string
    private readonly protocols: ReadonlyMap<string, ProtocolImplementation>

    /**
     * The canonical empty object.
     */
    static readonly empty = new LocalObject("Empty", [])

    constructor(name: string, protocols: readonly ProtocolImplementation[]) {
        this.name = name
        this.protocols = new Map(protocols.map((protocol) => [protocol.name, protocol]))
    }

    async conformsToProtocol(name: string): Promise<boolean> {
        return this.protocols.has(name)
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
        return await implementation(parameters)
    }

    toString(): string {
        return `<${this.name}>`
    }
}
