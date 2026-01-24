import type { Version } from "@/base/version"

export interface RPCObject {
    /**
     * The name of this object. Unique within its peers.
     */
    readonly name: string

    /**
     * Finds an object at the given address.
     *
     * @param address The address of the object to find.
     * An empty address refers to this object.
     * @returns The object at the given address, or null if not found.
     */
    find(address: readonly string[]): Promise<RPCObject | null>

    /**
     * Invokes a method on a protocol supported by this object.
     *
     * @param protocolName The name of the protocol the method belongs to.
     * @param protocolVersion The version of the protocol.
     * @param selector The name of the method to invoke.
     * @param parameters The parameters to pass to the method.
     * @returns The result of the method invocation.
     */
    invoke(
        protocolName: string,
        protocolVersion: Version,
        selector: string,
        parameters: unknown,
    ): Promise<unknown>

    /**
     * Checks if this object conforms to the given protocol.
     *
     * @param name The name of the protocol to check.
     * @param version The version of the protocol to check.
     * @returns True if this object conforms to the given protocol, false otherwise.
     */
    conformsToProtocol(name: string, version: Version): Promise<boolean>
}
