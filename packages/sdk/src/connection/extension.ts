import { implement, RPCConnection } from "@magritte/rpc"
import { MessageChannelTransport } from "@magritte/rpc/transports"

import { EventsProtocol, type Event } from "../common/events"
import { ExtensionProtocol } from "../extension"
import { PlayerProtocol, type Player } from "../host"
import { ChromeProtocol, type Chrome } from "../host/chrome"
import { createEvent } from "../utilities/events"
import { ConnectionHolder, ConnectResponse, type ConnectRequest } from "./handshake"

export interface ConnectToExtensionHostOptions {
    readonly extensionId: string
}

export class ExtensionHost extends ConnectionHolder {
    async chrome(): Promise<Chrome> {
        return this.castRemoteObject(ChromeProtocol)
    }

    async player(): Promise<Player> {
        return this.castRemoteObject(PlayerProtocol)
    }
}

export function connectToExtensionHost({
    extensionId,
}: ConnectToExtensionHostOptions): Promise<ExtensionHost> {
    if (!window.top || window.top === window) {
        return Promise.reject(new Error("No extension host found"))
    }
    const hostWindow = window.top
    return new Promise((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
            try {
                const data = ConnectResponse.parse(event.data)
                switch (data.type) {
                    case "connected": {
                        if (event.ports.length !== 2) {
                            throw new Error("Handshake received but wrong number of ports given")
                        }

                        const [_events, $events] = createEvent<Event>()
                        const exportedObject = [
                            implement(ExtensionProtocol, {}),
                            implement(EventsProtocol, {
                                dispatch: async (event) => {
                                    _events.dispatch(event)
                                },
                            }),
                        ]
                        const serialNumber = data.serialNumber
                        const transport = new MessageChannelTransport(
                            event.ports[0],
                            event.ports[1],
                        )
                        const connection = new RPCConnection({ transport, exportedObject })
                        resolve(new ExtensionHost($events, serialNumber, connection))
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
                type: "connect",
                extensionId,
            } satisfies ConnectRequest,
            "*",
        )
    })
}
