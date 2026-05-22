import {
    cast,
    implement,
    RPCBroadcaster,
    RPCConnection,
    type ProtocolImplementation,
} from "@magritte/rpc"
import { LoopbackTransport, MessageChannelTransport } from "@magritte/rpc/transports"

import { LibraryProtocol, PlayerProtocol, type Library, type Player } from "../host"
import { ChromeProtocol, type Chrome } from "../host/chrome"
import { ExtensionData } from "../manifest"
import { PlaybackEngineProtocol, type PlaybackEngine } from "./playbackEngine"

export interface ExtensionExportsObject {
    readonly playbackEngine?: PlaybackEngine
}

export type ExtensionExports = ExtensionExportsObject | (() => Promise<ExtensionExportsObject>)

async function implementExports(exports: ExtensionExports) {
    const { playbackEngine } = typeof exports === "function" ? await exports() : exports
    const implementations: ProtocolImplementation[] = []
    if (playbackEngine) {
        implementations.push(implement(PlaybackEngineProtocol, playbackEngine))
    }
    return implementations
}

export interface ExtensionHostConnectOptions {
    /** The ID of the current extension */
    readonly extensionId: string

    /** The broadcaster to use for communication with the extension host */
    readonly broadcaster?: RPCBroadcaster

    /** The exports to make available to the extension host */
    readonly exports?: ExtensionExports

    /** How long to wait for the extension host to connect, in milliseconds */
    readonly timeout?: number
}

export class ExtensionHost {
    static async connect({
        extensionId,
        broadcaster,
        exports = {},
        timeout = 10_000,
    }: ExtensionHostConnectOptions): Promise<ExtensionHost> {
        if (!window.top || window.top === window) {
            return Promise.reject(new Error("No extension host found"))
        }
        // NOTE: There isn't a chain of trust here, but having the host pass
        //       us this data in the URL hash serves a couple of purposes:
        //       1. It allows us to filter messages from the host based on the origin
        //       2. It allows to check that we're the extension the host is expecting
        const params = new URLSearchParams(window.location.hash.substring(1))
        const originParam = params.get("h")
        const dataParam = params.get("d")
        if (originParam === null || params.get("e") !== extensionId || dataParam === null) {
            return Promise.reject(new Error("Malformed host information"))
        }
        const data = ExtensionData.parse(JSON.parse(dataParam))

        const transport = await MessageChannelTransport.handshake({
            role: "requester",
            parentWindow: window.top,
            origin: originParam,
            identity: extensionId,
            timeout,
        })
        const exportedObject = await implementExports(exports)
        const connection = new RPCConnection({
            transport,
            broadcaster,
            exportedObject,
        })
        return new ExtensionHost(connection, data)
    }

    /**
     * Creates an extension host with an invalid connection.
     *
     * Use an invalid extension host if you wish to gracefully
     * recover from not being able to establish a connection
     * to the host in your extension.
     */
    static invalid(): ExtensionHost {
        const connection = new RPCConnection({
            transport: new LoopbackTransport(),
            exportedObject: [],
        })
        connection.invalidate()
        const data: ExtensionData = {}
        return new ExtensionHost(connection, data)
    }

    private constructor(
        readonly connection: RPCConnection,
        readonly data: ExtensionData,
    ) {}

    async disconnect(): Promise<void> {
        this.connection.invalidate()
    }

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
