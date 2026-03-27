import type { RPCObject } from "../object"
import type { RPCCommand, RPCCommandResult } from "../transport"

export type RemoteObjectSender = <Type extends RPCCommand["type"]>(
    command: Extract<RPCCommand, { type: Type }>,
) => Promise<Extract<RPCCommandResult, { type: Type }>>

export class RemoteObject implements RPCObject {
    constructor(private readonly send: RemoteObjectSender) {}

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
