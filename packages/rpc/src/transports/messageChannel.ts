import z4 from "zod/v4"

import { RPCTransportMessage, type RPCTransport } from "../transport"

const HandshakeRequest = z4.union([
    z4.object({
        /** The type of the message */
        type: z4.literal("handshakeRequest"),

        /** The identity of the iframe's content */
        identity: z4.string(),
    }),
])

const HandshakeResponse = z4.union([
    z4.object({
        /** The type of the message */
        type: z4.literal("handshakeResponse"),
    }),
])

function waitForHandshakeMessage(origin: string, timeout: number): Promise<MessageEvent> {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error("Handshake timeout"))
        }, timeout)
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== origin) {
                return
            }
            try {
                clearTimeout(timeoutId)
                resolve(event)
            } catch (error) {
                clearTimeout(timeoutId)
                reject(error)
            }
            window.removeEventListener("message", handleMessage)
        }
        window.addEventListener("message", handleMessage)
    })
}

export type MessageChannelTransportHandshakeOptions =
    | {
          /** The role of the current window in the handshake */
          role: "responder"

          /** The iframe element to establish a connection with */
          iframe: HTMLIFrameElement

          /** The origin of the iframe's content window */
          origin: string

          /** The expected identity of the iframe's content */
          identity: string

          /** How long to wait for a handshake request before timing out */
          timeout: number
      }
    | {
          /** The role of the current window in the handshake */
          role: "requester"

          /** The parent window to establish a connection with */
          parentWindow: Window

          /** The origin of the parent window */
          origin: string

          /** The identity of the iframe's content */
          identity: string

          /** How long to wait for a handshake response before timing out */
          timeout: number
      }

export class MessageChannelTransport implements RPCTransport {
    static createChannels() {
        const localChannel = new MessageChannel()
        const remoteChannel = new MessageChannel()
        return {
            localPorts: { send: localChannel.port1, receive: remoteChannel.port1 },
            remotePorts: { send: remoteChannel.port2, receive: localChannel.port2 },
        }
    }

    /**
     * Perform a handshake between an iframe and its parent window
     * to establish a message channel transport between them.
     */
    static async handshake(options: MessageChannelTransportHandshakeOptions) {
        switch (options.role) {
            case "responder": {
                const event = await waitForHandshakeMessage(options.origin, options.timeout)
                const data = HandshakeRequest.parse(event.data)
                switch (data.type) {
                    case "handshakeRequest": {
                        if (data.identity !== options.identity) {
                            throw new Error("Identity mismatch")
                        }
                        const channels = MessageChannelTransport.createChannels()
                        const transport = new MessageChannelTransport(
                            channels.localPorts.send,
                            channels.localPorts.receive,
                        )
                        options.iframe.contentWindow?.postMessage(
                            HandshakeResponse.parse({
                                type: "handshakeResponse",
                            }),
                            options.origin,
                            [channels.remotePorts.send, channels.remotePorts.receive],
                        )
                        return transport
                    }
                }
            }
            case "requester": {
                const pendingEvent = waitForHandshakeMessage(options.origin, options.timeout)
                options.parentWindow.postMessage(
                    HandshakeRequest.parse({
                        type: "handshakeRequest",
                        identity: options.identity,
                    }),
                    options.origin,
                )
                const event = await pendingEvent
                const eventData = HandshakeResponse.parse(event.data)
                switch (eventData.type) {
                    case "handshakeResponse": {
                        if (event.ports.length !== 2) {
                            throw new Error("Handshake received but wrong number of ports given")
                        }
                        const transport = new MessageChannelTransport(
                            event.ports[0],
                            event.ports[1],
                        )
                        return transport
                    }
                }
            }
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
