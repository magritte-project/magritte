import z4 from "zod/v4"

export const RPCTransportMessageSchema = z4.union([
    z4.object({
        type: z4.literal("object.conformsToProtocol"),
        path: z4.array(z4.string()),
        protocolName: z4.string(),
    }),
    z4.object({
        type: z4.literal("object.invoke"),
        path: z4.array(z4.string()),
        protocolName: z4.string(),
        selector: z4.string(),
        parameters: z4.unknown(),
    }),
])

export type RPCTransportMessage = z4.infer<typeof RPCTransportMessageSchema>

export const RPCTransportReplySchema = z4.union([
    z4.object({
        type: z4.literal("object.conformsToProtocol"),
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

export type RPCTransportReply = z4.infer<typeof RPCTransportReplySchema>

export function isWireReply<Type extends RPCTransportReply["type"]>(
    reply: RPCTransportReply,
    type: Type,
): reply is Extract<RPCTransportReply, { type: Type }> {
    return reply.type === type
}

export interface RPCTransport {
    send(message: RPCTransportMessage): Promise<RPCTransportReply>
}

export async function send<Type extends RPCTransportMessage["type"]>(
    transport: RPCTransport,
    message: Extract<RPCTransportMessage, { type: Type }>,
): Promise<Extract<RPCTransportReply, { type: Type }>> {
    const reply = await transport.send(message)
    if (isWireReply(reply, "error")) {
        throw new Error(reply.message)
    }
    if (!isWireReply(reply, message.type)) {
        throw new Error(`Reply to ${message.type} message was mismatched ${reply.type}`)
    }
    return reply
}
