import { MessageChannelConnection, RemoteObject, type RPCObject } from "@magritte/rpc"

import { handshakeResponseSchema, type HandshakeRequest } from "./wireProtocol"

export interface ExtensionHandshakeOptions {
    readonly extensionId: string
    readonly exportedObject: RPCObject
}

export interface ExtensionHandshakeResult {
    readonly host: RPCObject
}

export async function extensionHandshake({
    extensionId,
    exportedObject,
}: ExtensionHandshakeOptions): Promise<ExtensionHandshakeResult> {
    if (!window.top || window.top === window) {
        throw new Error("No extension host found")
    }
    const hostWindow = window.top
    return await new Promise<ExtensionHandshakeResult>((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
            try {
                const data = handshakeResponseSchema.parse(event.data)
                switch (data.type) {
                    case "handshake": {
                        if (event.ports.length !== 2) {
                            throw new Error("Handshake received but wrong number of ports given")
                        }
                        // const serialNumber = data.serialNumber
                        const connection = new MessageChannelConnection(
                            exportedObject,
                            event.ports[0],
                            event.ports[1],
                        )
                        resolve({ host: new RemoteObject(connection) })
                        break
                    }
                }
            } catch (error) {
                reject(error)
            }
            window.removeEventListener("message", handleMessage)
        }
        window.addEventListener("message", handleMessage)
        hostWindow.postMessage(
            {
                type: "handshake",
                extensionId,
            } satisfies HandshakeRequest,
            "*",
        )
    })
}
