import z4 from "zod/v4"

export const RPCCommand = z4.union([
    z4.object({
        type: z4.literal("object.getProtocolNames"),
    }),
    z4.object({
        type: z4.literal("object.implementsProtocol"),
        protocolName: z4.string(),
    }),
    z4.object({
        type: z4.literal("object.invoke"),
        protocolName: z4.string(),
        selector: z4.string(),
        parameters: z4.unknown(),
    }),
])
export type RPCCommand = z4.infer<typeof RPCCommand>

export const RPCTransportOutgoingMessage = z4.object({
    id: z4.string(),
    command: RPCCommand,
})
export type RPCTransportOutgoingMessage = z4.infer<typeof RPCTransportOutgoingMessage>

export const RPCCommandResult = z4.union([
    z4.object({
        type: z4.literal("object.getProtocolNames"),
        protocolNames: z4.array(z4.string()),
    }),
    z4.object({
        type: z4.literal("object.implementsProtocol"),
        conforms: z4.boolean(),
    }),
    z4.object({
        type: z4.literal("object.invoke"),
        result: z4.unknown(),
    }),
    z4.object({
        type: z4.literal("error"),
        name: z4.string(),
        message: z4.string(),
    }),
])
export type RPCCommandResult = z4.infer<typeof RPCCommandResult>

export const RPCTransportMessage = z4.union([
    z4.object({
        type: z4.literal("command"),
        id: z4.string(),
        command: RPCCommand,
    }),
    z4.object({
        type: z4.literal("result"),
        id: z4.string(),
        result: RPCCommandResult,
    }),
    z4.object({
        type: z4.literal("broadcast"),
        what: z4.string(),
        topic: z4.string(),
        data: z4.record(z4.string(), z4.string().optional()).optional(),
    }),
])
export type RPCTransportMessage = z4.infer<typeof RPCTransportMessage>

export interface RPCTransport {
    onmessage: ((message: RPCTransportMessage) => void) | null
    postMessage(message: RPCTransportMessage): void
    invalidate(): void
}
