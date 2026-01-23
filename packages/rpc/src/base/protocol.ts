import z from "zod/v4"

import {
    method,
    type _AnyRPCMethod,
    type _RPCMethodParameters,
    type _RPCMethodResult,
    type _RPCMethodSelector,
} from "@/base/method"
import { version, type Version } from "@/base/version"

export interface RPCProtocol<Methods extends readonly _AnyRPCMethod[]> {
    readonly name: string
    readonly version: Version
    readonly methods: Methods
}

/** Creates a new protocol. */
export function protocol<const Methods extends readonly _AnyRPCMethod[]>(
    name: string,
    version: Version,
    methods: Methods,
): RPCProtocol<Methods> {
    return {
        name,
        version,
        methods,
    }
}

export type _AnyRPCProtocol = RPCProtocol<readonly _AnyRPCMethod[]>

export const Adder = protocol("Adder", version(0), [
    method("add", z.object({ a: z.number(), b: z.number() }), z.number()),
])
