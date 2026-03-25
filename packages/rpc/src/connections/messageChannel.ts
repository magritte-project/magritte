import z4 from "zod/v4"

import type { RPCObject } from "../object"

import {
    dispatchMessage,
    RPConnectionMessageReplySchema,
    RPCConnectionMessageSchema,
    type RPCConnection,
    type RPCConnectionMessage,
    type RPConnectionMessageReply,
} from "../connection"

const wireProtocolSchema = z4.object({
    id: z4.string(),
    data: z4.union([
        z4.object({
            type: z4.literal("message"),
            message: RPCConnectionMessageSchema,
        }),
        z4.object({
            type: z4.literal("reply"),
            reply: RPConnectionMessageReplySchema,
        }),
    ]),
})

interface PendingSend {
    readonly resolve: (value: RPConnectionMessageReply) => void
    readonly reject: (reason?: unknown) => void
}

export class MessageChannelConnection implements RPCConnection {
    private readonly pending = new Map<string, PendingSend>()
    private isValid = true

    static createChannels() {
        const localChannel = new MessageChannel()
        const remoteChannel = new MessageChannel()
        return {
            localPorts: { send: localChannel.port1, receive: remoteChannel.port1 },
            remotePorts: { send: remoteChannel.port2, receive: localChannel.port2 },
        }
    }

    constructor(
        public readonly exportedObject: RPCObject,
        private readonly sendPort: MessagePort,
        private readonly receivePort: MessagePort,
    ) {
        this.receivePort.onmessage = (event) => {
            this.handleMessage(event)
        }
    }

    private postMessage(message: z4.infer<typeof wireProtocolSchema>) {
        this.sendPort.postMessage(message)
    }

    private async handleMessage(event: MessageEvent): Promise<void> {
        try {
            const { id, data } = wireProtocolSchema.parse(event.data)
            switch (data.type) {
                case "message": {
                    const reply = await dispatchMessage(data.message, this.exportedObject)
                    this.postMessage({ id, data: { type: "reply", reply } })
                    break
                }
                case "reply": {
                    const pending = this.pending.get(id)
                    if (pending) {
                        pending.resolve(data.reply)
                        this.pending.delete(id)
                    }
                    break
                }
            }
        } catch (error) {
            console.error("*** Could not handle message", error, event)
        }
    }

    async send(message: RPCConnectionMessage): Promise<RPConnectionMessageReply> {
        if (!this.isValid) {
            throw new Error("Connection is invalid")
        }
        const id = crypto.randomUUID()
        const reply = new Promise<RPConnectionMessageReply>((resolve, reject) => {
            this.pending.set(id, { resolve, reject })
        })
        this.postMessage({ id, data: { type: "message", message } })
        return await reply
    }

    invalidate(): void {
        if (!this.isValid) {
            return
        }

        this.sendPort.close()
        this.receivePort.close()
        this.receivePort.onmessage = null

        for (const [_, pending] of this.pending) {
            pending.reject(new Error("Connection invalidated"))
        }
        this.pending.clear()

        this.isValid = false
    }
}
