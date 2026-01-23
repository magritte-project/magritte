import type { _AnyRPCMethod } from "@/base/method"
import type { RPCObject } from "@/base/object"
import type { _AnyRPCProtocol } from "@/base/protocol"
import type { Version } from "@/base/version"

export class LocalObject implements RPCObject {
    constructor(
        readonly name: string,
        readonly protocols: readonly _AnyRPCProtocol[],
        private readonly subobjects: readonly RPCObject[],
        private readonly methods: readonly _AnyRPCMethod[],
    ) {}

    async find(address: readonly string[]): Promise<RPCObject | null> {
        if (address.length === 0) {
            return this
        } else {
            const [name, ...rest] = address
            const next = this.subobjects.find((subobject) => subobject.name === name)
            if (!next) {
                return null
            }
            return next.find(rest)
        }
    }

    async invoke(selector: string, parameters: unknown): Promise<unknown> {
        throw new Error("Method not implemented.")
    }

    async conformsToProtocol(name: string, version: Version): Promise<boolean> {
        return this.protocols.some(
            (candidate) =>
                candidate.name === name &&
                candidate.version.major === version.major &&
                candidate.version.minor >= version.minor,
        )
    }
}
