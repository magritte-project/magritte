export interface RPCObject {
    /**
     * Checks if this object conforms to the given protocol.
     *
     * @param name The name of the protocol to check.
     * @param version The version of the protocol to check.
     * @returns True if this object conforms to the given protocol, false otherwise.
     */
    conformsToProtocol(name: string): Promise<boolean>

    /**
     * Invokes a method on a protocol supported by this object.
     *
     * @param protocolName The name of the protocol the method belongs to.
     * @param selector The name of the method to invoke.
     * @param parameters The parameters to pass to the method.
     * @returns The result of the method invocation.
     */
    invoke(protocolName: string, selector: string, parameters: unknown): Promise<unknown>
}
