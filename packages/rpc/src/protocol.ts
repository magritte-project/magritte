import * as z4 from "zod/v4/core"

import type { RPCObject } from "./object.js"

export interface MethodSignatures {
    readonly [selector: string]: {
        readonly input: z4.$ZodType
        readonly output: z4.$ZodType
    }
}

/** An agreed-upon interface allowing two independent systems to work together */
export interface Protocol<Signatures extends MethodSignatures> {
    readonly name: string
    readonly signatures: Signatures
}

/** The callable interface of a protocol */
export type ProtocolInterface<Signatures extends MethodSignatures> = {
    [Method in keyof Signatures]: (
        parameters: z4.infer<Signatures[Method]["input"]>,
    ) => Promise<z4.infer<Signatures[Method]["output"]>>
}

/** An implementation of a protocol */
export interface ProtocolImplementation {
    readonly name: string
    readonly vtable: Record<string, (parameters: unknown) => Promise<unknown>>
}

/** Creates a new protocol */
export function protocol<const Signatures extends MethodSignatures>(
    name: string,
    signatures: Signatures,
): Protocol<Signatures> {
    return {
        name,
        signatures,
    }
}

/** Implement a protocol */
export function implement<Signatures extends MethodSignatures>(
    protocol: Protocol<Signatures>,
    implementation: ProtocolInterface<Signatures>,
): ProtocolImplementation {
    const vtable: Record<string, (parameters: unknown) => Promise<unknown>> = {}
    for (const selector in protocol.signatures) {
        const impl = implementation[selector] as (parameters: unknown) => Promise<unknown>
        const signature = protocol.signatures[selector]
        vtable[selector] = async (parameters) => {
            const result = await impl(z4.parse(signature.input, parameters))
            return z4.parse(signature.output, result)
        }
    }
    return {
        name: protocol.name,
        vtable,
    }
}

/**
 * Attempts to create a proxy to treat the given RPC object
 * as though it were an instance of the given protocol.
 *
 * @param protocol The protocol to cast to.
 * @param object The object to cast from.
 * @returns The proxy if the object conforms to the protocol, or null otherwise.
 */
export async function tryCast<Signatures extends MethodSignatures>(
    protocol: Protocol<Signatures>,
    object: RPCObject,
): Promise<ProtocolInterface<Signatures> | null> {
    if (!(await object.conformsToProtocol(protocol.name))) {
        return null
    }
    const proxy: Partial<Record<keyof Signatures, (parameters: unknown) => Promise<unknown>>> = {}
    for (const selector in protocol.signatures) {
        proxy[selector] = async (parameters) => {
            return await object.invoke(protocol.name, selector, parameters)
        }
    }
    return proxy as ProtocolInterface<Signatures>
}

/**
 * Creates a proxy to treat the given RPC object
 * as though it were an instance of the given protocol.
 *
 * @param protocol The protocol to cast to.
 * @param object The object to cast from.
 * @returns The proxy if the object conforms to the protocol.
 * @throws If the object does not conform to the protocol.
 */
export async function cast<Signatures extends MethodSignatures>(
    protocol: Protocol<Signatures>,
    object: RPCObject,
): Promise<ProtocolInterface<Signatures>> {
    const proxy = await tryCast(protocol, object)
    if (!proxy) {
        throw new Error(`Failed to cast ${object} to ${protocol.name}`)
    }
    return proxy
}
