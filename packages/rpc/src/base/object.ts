export type PRCObjectAddress = readonly string[]

export interface RPCObjectInspectOptions {
    /** Whether to recursively inspect subobjects */
    readonly recursive?: boolean
}

export interface RPCObject {
    /**
     * The name of this object. Unique within its peers.
     */
    readonly name: string

    /**
     * Inspects this object's subobjects.
     *
     * @param options Specifies how the object will be inspected.
     * @returns An array of object addresses.
     */
    inspect(options?: RPCObjectInspectOptions): Promise<readonly PRCObjectAddress[]>

    /**
     * Finds an object at the given address.
     *
     * @param address The address of the object to find.
     * An empty address refers to this object.
     * @returns The object at the given address, or null if not found.
     */
    find(address: PRCObjectAddress): Promise<RPCObject | null>

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
