import {
    cast,
    implement,
    RPCBroadcaster,
    RPCConnection,
    type ProtocolImplementation,
} from "@magritte/rpc"
import { LoopbackTransport, MessageChannelTransport } from "@magritte/rpc/transports"

import { ExtensionProtocol, PlaybackEngineProtocol, type PlaybackEngine } from "../extension"
import { LibraryProtocol, PlayerProtocol, type Library, type Player } from "../host"
import { ChromeProtocol, type Chrome } from "../host/chrome"
import { ExtensionData } from "../manifest"
import { ConnectionHolder, ConnectResponse, type ConnectRequest } from "./handshake"

export interface ExtensionExports {
    readonly playbackEngine?: PlaybackEngine
}

function implementExports(exports: ExtensionExports) {
    const implementations: ProtocolImplementation[] = []
    if (exports.playbackEngine) {
        implementations.push(implement(PlaybackEngineProtocol, exports.playbackEngine))
    }
    return implementations
}

export interface ConnectToExtensionHostOptions {
    readonly extensionId: string
    readonly broadcaster?: RPCBroadcaster
    readonly exports?: ExtensionExports
}

export class ExtensionHost extends ConnectionHolder {
    constructor(serialNumber: string, connection: RPCConnection, data: ExtensionData) {
        super(serialNumber, connection)
        this.data = data
    }

    /** Data passed to the extension from the host */
    readonly data: ExtensionData

    async chrome(): Promise<Chrome> {
        return cast(ChromeProtocol, this.connection.remoteObject)
    }

    async library(): Promise<Library> {
        return cast(LibraryProtocol, this.connection.remoteObject)
    }

    async player(): Promise<Player> {
        return cast(PlayerProtocol, this.connection.remoteObject)
    }
}

export function connectToExtensionHost({
    extensionId,
    broadcaster,
    exports = {},
}: ConnectToExtensionHostOptions): Promise<ExtensionHost> {
    if (!window.top || window.top === window) {
        return Promise.reject(new Error("No extension host found"))
    }
    const hostWindow = window.top
    // NOTE: There isn't a chain of trust here, but having the host pass
    //       us this data in the URL hash serves a couple of purposes:
    //       1. It allows us to filter messages from the host based on the origin
    //       2. It allows to check that we're the extension the host is expecting
    const hostParams = new URLSearchParams(window.location.hash.substring(1))
    const hostOrigin = hostParams.get("h")
    const hostData = hostParams.get("d")
    if (hostOrigin === null || hostParams.get("e") !== extensionId || hostData === null) {
        return Promise.reject(new Error("Malformed host information"))
    }
    const data = ExtensionData.parse(JSON.parse(hostData))
    return new Promise((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== hostOrigin) {
                return
            }
            try {
                const eventData = ConnectResponse.parse(event.data)
                switch (eventData.type) {
                    case "connected": {
                        if (event.ports.length !== 2) {
                            throw new Error("Handshake received but wrong number of ports given")
                        }

                        const exportedObject = [
                            ...implementExports(exports),
                            implement(ExtensionProtocol, {}),
                        ]
                        const serialNumber = eventData.serialNumber
                        const transport = new MessageChannelTransport(
                            event.ports[0],
                            event.ports[1],
                        )
                        const connection = new RPCConnection({
                            transport,
                            broadcaster,
                            exportedObject,
                        })
                        resolve(new ExtensionHost(serialNumber, connection, data))
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
            hostOrigin,
        )
    })
}

/**
 * Creates an extension host with an invalid connection.
 *
 * Use an invalid extension host if you wish to gracefully
 * recover from not being able to establish a connection
 * to the host in your extension.
 */
export function invalidConnectionHost(): ExtensionHost {
    const serialNumber = "invalid"
    const connection = new RPCConnection({
        transport: new LoopbackTransport(),
        exportedObject: [],
    })
    connection.invalidate()
    const data: ExtensionData = {}
    return new ExtensionHost(serialNumber, connection, data)
}
