import { RPCTransportMessage, type RPCTransport } from "../transport"

export class MessageChannelTransport implements RPCTransport {
    static createChannels() {
        const localChannel = new MessageChannel()
        const remoteChannel = new MessageChannel()
        return {
            localPorts: { send: localChannel.port1, receive: remoteChannel.port1 },
            remotePorts: { send: remoteChannel.port2, receive: localChannel.port2 },
        }
    }

    constructor(
        private readonly sendPort: MessagePort,
        private readonly receivePort: MessagePort,
    ) {
        this.onmessage = null
        this.receivePort.onmessage = (event) => {
            this.handleMessage(event)
        }
    }

    private async handleMessage(event: MessageEvent): Promise<void> {
        try {
            const reply = RPCTransportMessage.parse(event.data)
            this.onmessage?.(reply)
        } catch (error) {
            console.error("*** Could not handle message", error, event)
        }
    }

    onmessage: ((reply: RPCTransportMessage) => void) | null

    postMessage(message: RPCTransportMessage): void {
        this.sendPort.postMessage(message)
    }

    invalidate(): void {
        this.sendPort.close()
        this.receivePort.close()
        this.receivePort.onmessage = null
        this.onmessage = null
    }
}
