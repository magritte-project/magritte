import * as z4 from "zod/v4/core"

import type { _AnyRPCMethod, _RPCMethodSelector } from "@/base/method"
import type { RPCProjection } from "@/base/projection"
import type { Version } from "@/base/version"

import { type RPCProtocol } from "@/base/protocol"

export type RPCProtocolWitnessVTable = Record<string, (parameters: unknown) => Promise<unknown>>

export interface RPCProtocolWitness {
    readonly name: string
    readonly version: Version
    readonly vtable: RPCProtocolWitnessVTable
}

export function implement<const Methods extends readonly _AnyRPCMethod[]>(
    protocol: RPCProtocol<Methods>,
    implementation: RPCProjection<Methods>,
): RPCProtocolWitness {
    const vtable: RPCProtocolWitnessVTable = {}
    for (const method of protocol.methods) {
        const impl = implementation[method.selector as keyof typeof implementation] as (
            parameters: unknown,
        ) => Promise<unknown>
        vtable[method.selector] = async (parameters) => {
            const result = await impl(z4.parse(method.parameters, parameters))
            return z4.parse(method.result, result)
        }
    }
    return {
        name: protocol.name,
        version: protocol.version,
        vtable,
    }
}
