import {
    cast,
    implement,
    LocalObject,
    MessageChannelConnection,
    RemoteObject,
    type MethodSignatures,
    type Protocol,
    type ProtocolInterface,
    type RPCConnection,
    type RPCObject,
} from "@magritte/rpc"

import {
    NotificationsProtocol,
    type Notification,
    type Notifications,
} from "../common/notifications"
import { ExtensionProtocol } from "../extension"
import { PlayerProtocol, type Player } from "../host"
import { ChromeProtocol, type Chrome } from "../host/chrome"
import { createEvent, EventStream } from "../utilities/events"
import { zHostConnectResponse, type HostConnectRequest } from "./handshake"

export interface ConnectToExtensionHostOptions {
    readonly extensionId: string
}

export class ExtensionHost {
    private readonly remoteObject: RPCObject
    private readonly proxies: Map<string, Promise<unknown>>

    /** @private */
    constructor(
        public readonly $notifications: EventStream<Notification>,
        public readonly serialNumber: string,
        public readonly connection: RPCConnection,
    ) {
        this.remoteObject = new RemoteObject(connection)
        this.proxies = new Map()
    }

    private _cast<Signatures extends MethodSignatures>(
        protocol: Protocol<Signatures>,
    ): Promise<ProtocolInterface<Signatures>> {
        let proxy = this.proxies.get(protocol.name) as
            | Promise<ProtocolInterface<Signatures>>
            | undefined
        if (!proxy) {
            proxy = cast(protocol, this.remoteObject)
            this.proxies.set(protocol.name, proxy)
        }
        return proxy
    }

    async notifications(): Promise<Notifications> {
        return this._cast(NotificationsProtocol)
    }

    async chrome(): Promise<Chrome> {
        return this._cast(ChromeProtocol)
    }

    async player(): Promise<Player> {
        return this._cast(PlayerProtocol)
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
                const data = zHostConnectResponse.parse(event.data)
                switch (data.type) {
                    case "connected": {
                        if (event.ports.length !== 2) {
                            throw new Error("Handshake received but wrong number of ports given")
                        }

                        const [_notifications, $notifications] = createEvent<Notification>()
                        const exportedObject = new LocalObject([
                            implement(ExtensionProtocol, {}),
                            implement(NotificationsProtocol, {
                                post: async (notification) => {
                                    _notifications.dispatch(notification)
                                },
                            }),
                        ])
                        const serialNumber = data.serialNumber
                        const connection = new MessageChannelConnection(
                            exportedObject,
                            event.ports[0],
                            event.ports[1],
                        )
                        resolve(new ExtensionHost($notifications, serialNumber, connection))
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
            } satisfies HostConnectRequest,
            "*",
        )
    })
}
