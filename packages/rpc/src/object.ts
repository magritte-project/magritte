export interface RPCObject {
    /**
     * Get the names of the protocols this object advertises itself as implementing.
     */
    getProtocolNames(): Promise<string[]>

    /**
     * Checks if this object implements the given protocol.
     *
     * @param protocolName The name of the protocol to check for
     * an implementation of.
     * @returns True if this object implements the given protocol, false otherwise.
     */
    implementsProtocol(protocolName: string): Promise<boolean>

    /**
     * Invokes a method on a protocol implemented by this object.
     *
     * @param protocolName The name of the protocol the method belongs to.
     * @param selector The name of the method to invoke.
     * @param parameters The parameters to pass to the method.
     * @returns The result of the method invocation.
     */
    invoke(protocolName: string, selector: string, parameters: unknown): Promise<unknown>
}
