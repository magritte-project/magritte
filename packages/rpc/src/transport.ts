export type RPCTransportMessage =
    | {
          readonly type: "object.conformsToProtocol"
          readonly path: readonly string[]
          readonly protocolName: string
      }
    | {
          readonly type: "object.invoke"
          readonly path: readonly string[]
          readonly protocolName: string
          readonly selector: string
          readonly parameters: unknown
      }

export type RPCTransportReply =
    | {
          readonly type: "object.conformsToProtocol"
          readonly conforms: boolean
      }
    | {
          readonly type: "object.invoke"
          readonly result: unknown
      }
    | {
          readonly type: "error"
          readonly name: string
          readonly message: string
      }

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
