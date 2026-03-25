import z4 from "zod/v4"

import type { RPCObject } from "./object"

export const RPCConnectionMessageSchema = z4.union([
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

export type RPCConnectionMessage = z4.infer<typeof RPCConnectionMessageSchema>

export const RPConnectionMessageReplySchema = z4.union([
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

export type RPConnectionMessageReply = z4.infer<typeof RPConnectionMessageReplySchema>

export async function dispatchMessage(
    message: RPCConnectionMessage,
    object: RPCObject,
): Promise<RPConnectionMessageReply> {
    try {
        switch (message.type) {
            case "object.getProtocolNames":
                return {
                    type: "object.getProtocolNames",
                    protocolNames: await object.getProtocolNames(),
                }
            case "object.implementsProtocol":
                return {
                    type: "object.implementsProtocol",
                    conforms: await object.implementsProtocol(message.protocolName),
                }
            case "object.invoke":
                return {
                    type: "object.invoke",
                    result: await object.invoke(
                        message.protocolName,
                        message.selector,
                        message.parameters,
                    ),
                }
            default:
                throw new Error(`Unknown message type`)
        }
    } catch (error) {
        return {
            type: "error",
            name: error instanceof Error ? error.name : "UnknownError",
            message: error instanceof Error ? error.message : String(error),
        }
    }
}

export interface RPCConnection {
    /** The object exported by this side of the connection */
    readonly exportedObject: RPCObject

    send(message: RPCConnectionMessage): Promise<RPConnectionMessageReply>

    invalidate(): void
}
