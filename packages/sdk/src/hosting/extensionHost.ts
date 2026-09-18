import {
    cast,
    implement,
    RPCBroadcaster,
    RPCConnection,
    type ProtocolImplementation,
} from "@magritte/rpc"
import { LoopbackTransport, MessageChannelTransport } from "@magritte/rpc/transports"

import { CommandCoordinatorProtocol, type CommandCoordinator } from "../commands/coordinator"
import { CommandResponderProtocol, type CommandResponder } from "../commands/responder"
import { SearchCommandResponderProtocol, type SearchCommandResponder } from "../commands/search"
import { LibraryProtocol, type Library } from "../library"
import { NotificationCenterProtocol, type NotificationCenter } from "../notificationCenter"
import { PanelProtocol, type Panel } from "../panel"
import { PlaybackEngineProtocol, type PlaybackEngine } from "../playback/playbackEngine"
import { PlayerProtocol, type Player } from "../playback/player"
import { createDeferred, type Deferred } from "../utilities"

export interface ExtensionExportsOptions {
    /** The broadcaster to use for communication with the extension host */
    readonly broadcaster: RPCBroadcaster

    /** The extension host. Available after handshake has completed */
    readonly host: Deferred<ExtensionHost>
}

export interface ExtensionExportsObject {
    readonly commandResponder?: CommandResponder
    readonly searchCommandResponder?: SearchCommandResponder
    readonly playbackEngine?: PlaybackEngine
}

export type ExtensionExports =
    | ExtensionExportsObject
    | ((options: ExtensionExportsOptions) => Promise<ExtensionExportsObject>)

async function resolveExports(
    exports: ExtensionExports,
    options: ExtensionExportsOptions,
): Promise<ExtensionExportsObject> {
    return typeof exports === "function" ? await exports(options) : exports
}

async function implementExports({
    commandResponder,
    searchCommandResponder,
    playbackEngine,
}: ExtensionExportsObject) {
    const implementations: ProtocolImplementation[] = []
    if (commandResponder) {
        implementations.push(implement(CommandResponderProtocol, commandResponder))
    }
    if (searchCommandResponder) {
        implementations.push(implement(SearchCommandResponderProtocol, searchCommandResponder))
    }
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
        broadcaster = new RPCBroadcaster(),
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
        if (originParam === null || params.get("e") !== extensionId) {
            return Promise.reject(new Error("Malformed host information"))
        }

        const transport = await MessageChannelTransport.handshake({
            role: "requester",
            parentWindow: window.top,
            origin: originParam,
            identity: extensionId,
            timeout,
        })
        const hostForExports = createDeferred<ExtensionHost>()
        const resolvedExports = await resolveExports(exports, {
            broadcaster,
            host: hostForExports.deferred,
        })
        const exportedObject = await implementExports(resolvedExports)
        const connection = new RPCConnection({
            transport,
            broadcaster,
            exportedObject,
        })
        const beforeUnload = () => connection.invalidate()
        window.addEventListener("beforeunload", beforeUnload, { once: true })
        connection.subscribe((event) => {
            if (event.type === "invalidated") {
                window.removeEventListener("beforeunload", beforeUnload)
            }
        })
        const host = new ExtensionHost(connection)
        hostForExports.resolve(host)
        return host
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
        return new ExtensionHost(connection)
    }

    private constructor(readonly connection: RPCConnection) {}

    async disconnect(): Promise<void> {
        this.connection.invalidate()
    }

    async commandCoordinator(): Promise<CommandCoordinator> {
        return cast(CommandCoordinatorProtocol, this.connection.remoteObject)
    }

    async notificationCenter(): Promise<NotificationCenter> {
        return cast(NotificationCenterProtocol, this.connection.remoteObject)
    }

    async library(): Promise<Library> {
        return cast(LibraryProtocol, this.connection.remoteObject)
    }

    async player(): Promise<Player> {
        return cast(PlayerProtocol, this.connection.remoteObject)
    }

    async panel(): Promise<Panel> {
        return cast(PanelProtocol, this.connection.remoteObject)
    }
}
