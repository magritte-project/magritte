import type { RPCObject } from "./object"

import {
    type RPCConnection,
    type RPCConnectionMessage,
    type RPConnectionMessageReply,
} from "./connection"

function isMessageReply<Type extends RPConnectionMessageReply["type"]>(
    reply: RPConnectionMessageReply,
    type: Type,
): reply is Extract<RPConnectionMessageReply, { type: Type }> {
    return reply.type === type
}

export class RemoteObject implements RPCObject {
    constructor(private readonly connection: RPCConnection) {}

    private async send<Type extends RPCConnectionMessage["type"]>(
        message: Extract<RPCConnectionMessage, { type: Type }>,
    ): Promise<Extract<RPConnectionMessageReply, { type: Type }>> {
        const reply = await this.connection.send(message)
        if (isMessageReply(reply, "error")) {
            throw new Error(reply.message)
        }
        if (!isMessageReply(reply, message.type)) {
            throw new Error(`Reply to ${message.type} message was mismatched ${reply.type}`)
        }
        return reply
    }

    async getProtocolNames(): Promise<string[]> {
        const reply = await this.send({
            type: "object.getProtocolNames",
        })
        return reply.protocolNames
    }

    async implementsProtocol(protocolName: string): Promise<boolean> {
        const reply = await this.send({
            type: "object.implementsProtocol",
            protocolName,
        })
        return reply.conforms
    }

    async invoke(protocolName: string, selector: string, parameters: unknown): Promise<unknown> {
        const reply = await this.send({
            type: "object.invoke",
            protocolName,
            selector,
            parameters,
        })
        return reply.result
    }
}
