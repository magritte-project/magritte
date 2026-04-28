import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

export const RemoteEvent = z4.object({
    /** The type of the event */
    type: z4.string(),

    /** Optional data associated with the event */
    data: z4.record(z4.string(), z4.string()).optional(),
})

export type RemoteEvent = z4.infer<typeof RemoteEvent>

export const RemoteEventSinkProtocol = protocol("Magritte.EventSink", {
    /** Post an event to the other side of a connection */
    dispatch: {
        input: RemoteEvent,
        output: z4.void(),
    },
})

export type RemoteEventSink = ProtocolObject<typeof RemoteEventSinkProtocol>
