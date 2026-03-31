import { cast, implement, RPCConnection } from "@magritte/rpc"
import { MessageChannelTransport } from "@magritte/rpc/transports"

import { EventsProtocol, type Event } from "../common/events"
import { PlaybackEngineProtocol, type PlaybackEngine } from "../extension"
import { ChromeProtocol, PlayerProtocol, type Chrome, type Player } from "../host"
import { getExtensionOrigin, type ExtensionManifest } from "../manifest"
import { createEvent } from "../utilities/events"
import { ConnectionHolder, ConnectRequest, type ConnectResponse } from "./handshake"

export class Extension extends ConnectionHolder {
    async playbackEngine(): Promise<PlaybackEngine> {
        return cast(PlaybackEngineProtocol, this.connection.remoteObject)
    }
}

export interface WaitForExtensionConnectionOptions {
    readonly iframe: HTMLIFrameElement
    readonly manifest: ExtensionManifest
    readonly chrome: Chrome
    readonly player: Player
}

export function waitForExtensionConnection({
    iframe,
    manifest,
    chrome,
    player,
}: WaitForExtensionConnectionOptions): Promise<Extension> {
    const origin = getExtensionOrigin(manifest)
    return new Promise((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== origin) {
                return
            }
            try {
                const data = ConnectRequest.parse(event.data)
                switch (data.type) {
                    case "connect": {
                        if (data.extensionId !== manifest.id) {
                            throw new Error("Extension ID mismatch")
                        }
                        const [_events, $events] = createEvent<Event>()
                        const exportedObject = [
                            implement(ChromeProtocol, chrome),
                            implement(PlayerProtocol, player),
                            implement(EventsProtocol, {
                                dispatch: async (event) => {
                                    _events.dispatch(event)
                                },
                            }),
                        ]
                        const channels = MessageChannelTransport.createChannels()
                        const transport = new MessageChannelTransport(
                            channels.localPorts.send,
                            channels.localPorts.receive,
                        )
                        const connection = new RPCConnection({ transport, exportedObject })
                        const serialNumber = crypto.randomUUID()
                        iframe.contentWindow?.postMessage(
                            {
                                type: "connected",
                                serialNumber,
                            } satisfies ConnectResponse,
                            origin,
                            [channels.remotePorts.send, channels.remotePorts.receive],
                        )
                        resolve(new Extension($events, serialNumber, connection))
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
