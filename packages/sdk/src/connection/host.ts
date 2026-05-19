import { cast, implement, RPCBroadcaster, RPCConnection } from "@magritte/rpc"
import { MessageChannelTransport } from "@magritte/rpc/transports"

import { PlaybackEngineProtocol, type PlaybackEngine } from "../extension"
import {
    ChromeProtocol,
    LibraryProtocol,
    PlayerProtocol,
    type Chrome,
    type Library,
    type Player,
} from "../host"
import { getExtensionOrigin, type ExtensionManifest } from "../manifest"
import { ConnectionHolder, ConnectRequest, type ConnectResponse } from "./handshake"

export interface HostExports {
    readonly chrome: Chrome
    readonly library: Library
    readonly player: Player
}

function implementExports(exports: HostExports) {
    return [
        implement(ChromeProtocol, exports.chrome),
        implement(LibraryProtocol, exports.library),
        implement(PlayerProtocol, exports.player),
    ]
}

export interface WaitForExtensionConnectionOptions {
    readonly iframe: HTMLIFrameElement
    readonly manifest: ExtensionManifest
    readonly broadcaster?: RPCBroadcaster
    readonly exports: HostExports
    readonly timeout?: number
}

export class Extension extends ConnectionHolder {
    async playbackEngine(): Promise<PlaybackEngine> {
        return cast(PlaybackEngineProtocol, this.connection.remoteObject)
    }
}

export function waitForExtensionConnection({
    iframe,
    manifest,
    broadcaster,
    exports,
    timeout = 30_000,
}: WaitForExtensionConnectionOptions): Promise<Extension> {
    const origin = getExtensionOrigin(manifest)
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error("Timed out waiting for extension connection"))
        }, timeout)
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
                        const exportedObject = [...implementExports(exports)]
                        const channels = MessageChannelTransport.createChannels()
                        const transport = new MessageChannelTransport(
                            channels.localPorts.send,
                            channels.localPorts.receive,
                        )
                        const connection = new RPCConnection({
                            transport,
                            broadcaster,
                            exportedObject,
                        })
                        const serialNumber = crypto.randomUUID()
                        iframe.contentWindow?.postMessage(
                            {
                                type: "connected",
                                serialNumber,
                            } satisfies ConnectResponse,
                            origin,
                            [channels.remotePorts.send, channels.remotePorts.receive],
                        )
                        clearTimeout(timeoutId)
                        resolve(new Extension(serialNumber, connection))
                        break
                    }
                }
            } catch (error) {
                clearTimeout(timeoutId)
                reject(error)
            }
            window.removeEventListener("message", handleMessage)
        }
        window.addEventListener("message", handleMessage)
    })
}
