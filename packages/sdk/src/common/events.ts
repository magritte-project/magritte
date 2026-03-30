import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

export const Event = z4.object({
    /** The type of the event */
    type: z4.string(),

    /** Optional data associated with the event */
    data: z4.record(z4.string(), z4.string()).optional(),
})

export type Event = z4.infer<typeof Event>

export const EventsProtocol = protocol("Magritte.Events", {
    /** Post an event to the other side of a connection */
    dispatch: {
        input: Event,
        output: z4.void(),
    },
})

export type Events = ProtocolObject<typeof EventsProtocol>
