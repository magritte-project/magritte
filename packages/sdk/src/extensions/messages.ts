import z4 from "zod/v4"

export const hostMessageSchema = z4.union([
    z4.object({
        type: z4.literal("handshake"),
        extensionId: z4.string(),
    }),
])

export type HostMessage = z4.infer<typeof hostMessageSchema>

export const extensionMessageSchema = z4.union([
    z4.object({
        type: z4.literal("handshake"),
        serialNumber: z4.string(),
    }),
])

export type ExtensionMessage = z4.infer<typeof extensionMessageSchema>

/**
 * Create and return the message ports needed to establish
 * two-way communication between an extension and its host.
 */
export function createExtensionMessagePorts() {
    const host = new MessageChannel()
    const extension = new MessageChannel()
    return {
        host: {
            sendPort: extension.port1,
            receivePort: host.port1,
        },
        extension: {
            sendPort: host.port2,
            receivePort: extension.port2,
        },
    }
}
