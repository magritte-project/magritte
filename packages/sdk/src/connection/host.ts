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

import type { ExtensionManifest } from "../manifest"

import {
    NotificationsProtocol,
    type Notification,
    type Notifications,
} from "../common/notifications"
import { ChromeProtocol, PlayerProtocol, type Chrome, type Player } from "../host"
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
    readonly manifest: ExtensionManifest
    readonly chrome: Chrome
    readonly nowPlaying: Player
}

export function waitForExtensionConnection({
    iframe,
    manifest,
    chrome,
    nowPlaying,
}: WaitForExtensionConnectionOptions): Promise<Extension> {
    return new Promise((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== manifest.origin) {
                return
            }
            try {
                const data = zHostConnectRequest.parse(event.data)
                switch (data.type) {
                    case "connect": {
                        if (data.extensionId !== manifest.id) {
                            throw new Error("Extension ID mismatch")
                        }
                        const [_notifications, $notifications] = createEvent<Notification>()
                        const exportedObject = new LocalObject([
                            implement(ChromeProtocol, chrome),
                            implement(PlayerProtocol, nowPlaying),
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
                            manifest.origin,
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
