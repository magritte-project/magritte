import type { RPCObject } from "@/base/object"
import { isCompatible, type Version } from "@/base/version"
import { type RPCProtocolWitness } from "@/base/witness"

export class LocalObject implements RPCObject {
    readonly name: string
    private readonly protocols: ReadonlyMap<string, RPCProtocolWitness>,
    private readonly subobjects: ReadonlyMap<string, RPCObject>,

    constructor(
        name: string,
        protocols: readonly RPCProtocolWitness[],
        subobjects: readonly RPCObject[],
    ) {
        this.name = name
        this.protocols = new Map(protocols.map((protocol) => [protocol.name, protocol]))
        this.subobjects = new Map(subobjects.map((subobject) => [subobject.name, subobject]))
    }

    async find(address: readonly string[]): Promise<RPCObject | null> {
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

    async invoke(
        protocolName: string,
        protocolVersion: Version,
        selector: string,
        parameters: unknown,
    ): Promise<unknown> {
        const protocol = this.protocols.get(protocolName)
        if (protocol === undefined) {
            throw new Error(`Protocol ${protocolName} not found`)
        }
        if (!isCompatible(protocol.version, protocolVersion)) {
            throw new Error(`Protocol ${protocolName} version ${protocolVersion} not supported`)
        }
        const implementation = protocol.vtable[selector]
        if (implementation === undefined) {
            throw new Error(`Selector ${selector} not implemented by ${protocolName}@${protocol.version}`)
        }
        return await implementation(parameters)
    }

    async conformsToProtocol(name: string, version: Version): Promise<boolean> {
        const protocol = this.protocols.get(name)
        if (protocol === undefined) {
            return false
        }
        return isCompatible(protocol.version, version)
    }
}
