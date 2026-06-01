import { cast, implement, RPCBroadcaster, RPCConnection } from "@magritte/rpc"
import { MessageChannelTransport } from "@magritte/rpc/transports"

import { type Chrome, ChromeProtocol } from "../chrome"
import { type CommandCoordinator, CommandCoordinatorProtocol } from "../commands/coordinator"
import { type Library, LibraryProtocol } from "../library"
import { type ExtensionManifest, getExtensionOrigin } from "../manifest"
import { type PlaybackEngine, PlaybackEngineProtocol } from "../playback/playbackEngine"
import { type Player, PlayerProtocol } from "../playback/player"

export interface HostExportsOptions {
    /** The manifest of the extension */
    readonly manifest: ExtensionManifest

    /** The broadcaster to use for communication with the extension */
    readonly broadcaster: RPCBroadcaster
}

export interface HostExportsObject {
    readonly commandCoordinator: CommandCoordinator
    readonly chrome: Chrome
    readonly library: Library
    readonly player: Player
}

export type HostExports =
    | HostExportsObject
    | ((options: HostExportsOptions) => Promise<HostExportsObject>)

async function implementExports(options: HostExportsOptions, exports: HostExports) {
    const { commandCoordinator, chrome, library, player } =
        typeof exports === "function" ? await exports(options) : exports
    return [
        implement(CommandCoordinatorProtocol, commandCoordinator),
        implement(ChromeProtocol, chrome),
        implement(LibraryProtocol, library),
        implement(PlayerProtocol, player),
    ]
}

export interface ExtensionWaitForConnectionOptions {
    /** The iframe element pointed at the extension */
    readonly iframe: HTMLIFrameElement

    /** The manifest of the extension */
    readonly manifest: ExtensionManifest

    /** The broadcaster to use for communication with the extension */
    readonly broadcaster?: RPCBroadcaster

    /** The exports to make available to the extension */
    readonly exports: HostExports

    /** How long to wait for the extension's connection */
    readonly timeout?: number
}

export class Extension {
    static async waitForConnection({
        iframe,
        manifest,
        broadcaster = new RPCBroadcaster(),
        exports,
        timeout = 30_000,
    }: ExtensionWaitForConnectionOptions): Promise<Extension> {
        const origin = getExtensionOrigin(manifest)
        const identity = manifest.id
        const transport = await MessageChannelTransport.handshake({
            role: "responder",
            iframe,
            origin,
            identity,
            timeout,
        })
        const exportedObject = await implementExports({ manifest, broadcaster }, exports)
        const connection = new RPCConnection({
            transport,
            broadcaster,
            exportedObject,
        })
        return new Extension(connection, manifest)
    }

    /** @private */
    private constructor(
        readonly connection: RPCConnection,
        readonly manifest: ExtensionManifest,
    ) {}

    async disconnect(): Promise<void> {
        this.connection.invalidate()
    }

    async playbackEngine(): Promise<PlaybackEngine> {
        return cast(PlaybackEngineProtocol, this.connection.remoteObject)
    }
}
