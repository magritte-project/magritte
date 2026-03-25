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
import { ChromeProtocol, NowPlayingProtocol, type Chrome, type NowPlaying } from "../host"
import { createEvent, type EventStream } from "../utilities/events"
import { zHostConnectRequest, type HostConnectResponse } from "./handshake"

export class Extension {
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
}

export interface WaitForExtensionConnectionOptions {
    readonly iframe: HTMLIFrameElement
    readonly origin: string
    readonly chrome: Chrome
    readonly nowPlaying: NowPlaying
}

export function waitForExtensionConnection({
    iframe,
    origin,
    chrome,
    nowPlaying,
}: WaitForExtensionConnectionOptions): Promise<Extension> {
    return new Promise((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== origin) {
                return
            }
            try {
                const data = zHostConnectRequest.parse(event.data)
                switch (data.type) {
                    case "connect": {
                        const [_notifications, $notifications] = createEvent<Notification>()
                        const exportedObject = new LocalObject([
                            implement(ChromeProtocol, chrome),
                            implement(NowPlayingProtocol, nowPlaying),
                            implement(NotificationsProtocol, {
                                post: async (notification) => {
                                    _notifications.dispatch(notification)
                                },
                            }),
                        ])
                        const channels = MessageChannelConnection.createChannels()
                        const connection = new MessageChannelConnection(
                            exportedObject,
                            channels.localPorts.send,
                            channels.localPorts.receive,
                        )
                        const serialNumber = crypto.randomUUID()
                        iframe.contentWindow?.postMessage(
                            {
                                type: "connected",
                                serialNumber,
                            } satisfies HostConnectResponse,
                            origin,
                            [channels.remotePorts.send, channels.remotePorts.receive],
                        )
                        resolve(new Extension($notifications, serialNumber, connection))
                        break
                    }
                }
            } catch (error) {
                reject(error)
            }
            window.removeEventListener("message", handleMessage)
        }
        window.addEventListener("message", handleMessage)
    })
}
