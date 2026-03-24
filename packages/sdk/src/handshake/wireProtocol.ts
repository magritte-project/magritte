import z4 from "zod/v4"

/**
 * The schema of a handshake request posted by an extension running in an `<iframe>`.
 */
export const handshakeRequestSchema = z4.union([
    z4.object({
        type: z4.literal("handshake"),
        extensionId: z4.string(),
    }),
])

export type HandshakeRequest = z4.infer<typeof handshakeRequestSchema>

/**
 * The schema of a handshake response posted by the host window.
 */
export const handshakeResponseSchema = z4.union([
    z4.object({
        type: z4.literal("handshake"),
        serialNumber: z4.string(),
    }),
])

export type HandshakeResponse = z4.infer<typeof handshakeResponseSchema>
