import type { PRCObjectAddress, RPCObject, RPCObjectInspectOptions } from "@/base/object"
import type { ProtocolImplementation } from "@/base/protocol"

export class LocalObject implements RPCObject {
    readonly name: string
    private readonly protocols: ReadonlyMap<string, ProtocolImplementation>
    private readonly subobjects: ReadonlyMap<string, RPCObject>

    constructor(
        name: string,
        protocols: readonly ProtocolImplementation[],
        subobjects: readonly RPCObject[],
    ) {
        this.name = name
        this.protocols = new Map(protocols.map((protocol) => [protocol.name, protocol]))
        this.subobjects = new Map(subobjects.map((subobject) => [subobject.name, subobject]))
    }

    async getName(): Promise<string> {
        return this.name
    }

    async inspect({ recursive, ...rest }: RPCObjectInspectOptions = {}): Promise<
        readonly PRCObjectAddress[]
    > {
        const addresses: PRCObjectAddress[] = []
        for (const subobject of this.subobjects.values()) {
            addresses.push([await subobject.getName()])
            if (recursive) {
                const subaddresses = await subobject.inspect({ recursive, ...rest })
                for (const address of subaddresses) {
                    addresses.push([await subobject.getName(), ...address])
                }
            }
        }
        return addresses
    }

    async find(address: PRCObjectAddress): Promise<RPCObject | null> {
        if (address.length === 0) {
            return this
        } else {
            const [name, ...rest] = address
            const next = this.subobjects.get(name)
            if (next === undefined) {
                return null
            }
            return next.find(rest)
        }
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
}
