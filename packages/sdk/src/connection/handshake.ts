import {
    cast,
    type MethodSignatures,
    type Protocol,
    type ProtocolInterface,
    type RPCConnection,
} from "@magritte/rpc"
import z4 from "zod/v4"

import type { EventStream } from "../utilities"

import { EventsProtocol, type Event } from "../common"

/**
 * The schema of a handshake request posted by an extension running in an `<iframe>`.
 */
export const ConnectRequest = z4.union([
    z4.object({
        type: z4.literal("connect"),
        extensionId: z4.string(),
    }),
])

export type ConnectRequest = z4.infer<typeof ConnectRequest>

/**
 * The schema of a handshake response posted by the host window.
 */
export const ConnectResponse = z4.union([
    z4.object({
        type: z4.literal("connected"),
        serialNumber: z4.string(),
    }),
])

export type ConnectResponse = z4.infer<typeof ConnectResponse>

export class ConnectionHolder {
    private readonly remoteObjectProxies: Map<string, Promise<unknown>>

    /** @private */
    constructor(
        public readonly $events: EventStream<Event>,
        public readonly serialNumber: string,
        public readonly connection: RPCConnection,
    ) {
        this.remoteObjectProxies = new Map()
    }

    castRemoteObject<Signatures extends MethodSignatures>(
        protocol: Protocol<Signatures>,
    ): Promise<ProtocolInterface<Signatures>> {
        let proxy = this.remoteObjectProxies.get(protocol.name) as
            | Promise<ProtocolInterface<Signatures>>
            | undefined
        if (!proxy) {
            proxy = cast(protocol, this.connection.remoteObject)
            this.remoteObjectProxies.set(protocol.name, proxy)
        }
        return proxy
    }

    async dispatchEvent(event: Event): Promise<void> {
        const events = await this.castRemoteObject(EventsProtocol)
        await events.dispatch(event)
    }
}
