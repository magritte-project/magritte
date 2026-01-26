import type { PRCObjectAddress, RPCObjectInspectOptions } from "@/base/object"

export type TransportMessage =
    | {
          readonly type: "object.getName"
          readonly target: PRCObjectAddress
      }
    | {
          readonly type: "object.inspect"
          readonly target: PRCObjectAddress
          readonly options: RPCObjectInspectOptions
      }
    | {
          readonly type: "object.find"
          readonly target: PRCObjectAddress
          readonly address: PRCObjectAddress
      }
    | {
          readonly type: "object.conformsToProtocol"
          readonly target: PRCObjectAddress
          readonly name: string
      }
    | {
          readonly type: "object.invoke"
          readonly target: PRCObjectAddress
          readonly protocolName: string
          readonly selector: string
          readonly parameters: unknown
      }

export type TransportReply =
    | { readonly type: "object.getName"; readonly name: string }
    | { readonly type: "object.inspect"; readonly addresses: readonly PRCObjectAddress[] }
    | { readonly type: "object.find"; readonly exists: boolean }
    | {
          readonly type: "object.conformsToProtocol"
          readonly conforms: boolean
      }
    | {
          readonly type: "object.invoke"
          readonly result: unknown
      }
    | { readonly type: "error"; readonly message: string }

export interface Transport {
    send(message: TransportMessage): Promise<TransportReply>
}

function isReply<Type extends TransportReply["type"]>(
    reply: TransportReply,
    type: Type,
): reply is Extract<TransportReply, { type: Type }> {
    return reply.type === type
}

export async function send<Type extends TransportMessage["type"]>(
    transport: Transport,
    message: Extract<TransportMessage, { type: Type }>,
): Promise<Extract<TransportReply, { type: Type }>> {
    const reply = await transport.send(message)
    if (isReply(reply, "error")) {
        throw new Error(reply.message)
    }
    if (!isReply(reply, message.type)) {
        throw new Error(`Reply to ${message.type} message was mismatched ${reply.type}`)
    }
    return reply
}
