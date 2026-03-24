import { MessageChannelConnection, RemoteObject, type RPCObject } from "@magritte/rpc"

import { handshakeRequestSchema, type HandshakeResponse } from "./wireProtocol"

export interface HostHandshakeOptions {
    readonly extensionIFrame: HTMLIFrameElement
    readonly origin: string
    readonly exportedObject: RPCObject
}

export interface HostHandshakeResult {
    readonly extension: RPCObject
}

export async function hostHandshake({
    extensionIFrame,
    origin,
    exportedObject,
}: HostHandshakeOptions): Promise<HostHandshakeResult> {
    return await new Promise<HostHandshakeResult>((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== origin) {
                return
            }

            try {
                const hostChannel = new MessageChannel()
                const extensionChannel = new MessageChannel()

                const connection = new MessageChannelConnection(
                    exportedObject,
                    hostChannel.port1,
                    extensionChannel.port1,
                )

                const data = handshakeRequestSchema.parse(event.data)
                switch (data.type) {
                    case "handshake":
                        extensionIFrame.contentWindow?.postMessage(
                            {
                                type: "handshake",
                                serialNumber: crypto.randomUUID(),
                            } satisfies HandshakeResponse,
                            origin,
                            [extensionChannel.port2, hostChannel.port2],
                        )
                        break
                }

                resolve({ extension: new RemoteObject(connection) })
            } catch (error) {
                reject(error)
            }
            window.removeEventListener("message", handleMessage)
        }
        window.addEventListener("message", handleMessage)
    })
}
