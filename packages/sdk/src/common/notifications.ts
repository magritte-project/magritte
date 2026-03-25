import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

export const zNotification = z4.object({
    /** The name of the notification */
    name: z4.string(),

    /** Optional data associated with the notification */
    data: z4.record(z4.string(), z4.string()).optional(),
})

export type Notification = z4.infer<typeof zNotification>

export const NotificationsProtocol = protocol("Magritte.Notifications", {
    /** Post a notification to the other side of a connection */
    post: {
        input: zNotification,
        output: z4.void(),
    },
})

export type Notifications = ProtocolObject<typeof NotificationsProtocol>
