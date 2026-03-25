import z4 from "zod/v4"

/**
 * The schema of a handshake request posted by an extension running in an `<iframe>`.
 */
export const zHostConnectRequest = z4.union([
    z4.object({
        type: z4.literal("connect"),
        extensionId: z4.string(),
    }),
])

export type HostConnectRequest = z4.infer<typeof zHostConnectRequest>

/**
 * The schema of a handshake response posted by the host window.
 */
export const zHostConnectResponse = z4.union([
    z4.object({
        type: z4.literal("connected"),
        serialNumber: z4.string(),
    }),
])

export type HostConnectResponse = z4.infer<typeof zHostConnectResponse>
