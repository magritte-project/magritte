import { cast, type RPCConnection } from "@magritte/rpc"
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
    /** @private */
    constructor(
        public readonly $events: EventStream<Event>,
        public readonly serialNumber: string,
        public readonly connection: RPCConnection,
    ) {}

    async dispatchEvent(event: Event): Promise<void> {
        const events = await cast(EventsProtocol, this.connection.remoteObject)
        await events.dispatch(event)
    }

    async disconnect(): Promise<void> {
        this.connection.invalidate()
    }
}
