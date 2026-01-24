import type { _AnyRPCMethod, _RPCMethodSelector, RPCMethodImplementation } from "@/base/method"
import type { RPCObject } from "@/base/object"
import type { RPCProtocol } from "@/base/protocol"

/** Utility type which converts a tuple of RPC methods into an object type */
export type RPCProjection<Methods extends readonly _AnyRPCMethod[]> = {
    [Method in Methods[number] as _RPCMethodSelector<Method>]: RPCMethodImplementation<Method>
}

/**
 * Attempts to create a projection to treat the given RPC object
 * as though it were an instance of the given protocol.
 *
 * @param protocol The protocol to project onto.
 * @param object The object to project from.
 * @returns The projection if the object conforms to the protocol, or null otherwise.
 */
export async function tryProject<Methods extends readonly _AnyRPCMethod[]>(
    protocol: RPCProtocol<Methods>,
    object: RPCObject,
): Promise<RPCProjection<Methods> | null> {
    if (!(await object.conformsToProtocol(protocol.name, protocol.version))) {
        return null
    }
    const projection: Record<string, (parameters: unknown) => Promise<unknown>> = {}
    for (const method of protocol.methods) {
        const selector = method.selector
        projection[selector] = async (parameters: unknown) => {
            return await object.invoke(protocol.name, protocol.version, selector, parameters)
        }
    }
    return projection as RPCProjection<Methods>
}

/**
 * Creates a projection to treat the given RPC object
 * as though it were an instance of the given protocol.
 *
 * @param protocol The protocol to project onto.
 * @param object The object to project from.
 * @returns The projection if the object conforms to the protocol.
 * @throws If the object does not conform to the protocol.
 */
export async function project<Methods extends readonly _AnyRPCMethod[]>(
    protocol: RPCProtocol<Methods>,
    object: RPCObject,
): Promise<RPCProjection<Methods>> {
    const projection = await tryProject(protocol, object)
    if (!projection) {
        throw new Error(`Failed to cast ${object.name} to ${protocol.name}@${protocol.version}`)
    }
    return projection
}
