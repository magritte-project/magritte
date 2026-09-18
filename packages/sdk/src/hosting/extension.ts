import type { ExtensionManifest } from "@magritte/api"
import { cast, implement, RPCBroadcaster, RPCConnection } from "@magritte/rpc"
import { MessageChannelTransport } from "@magritte/rpc/transports"

import { type CommandCoordinator, CommandCoordinatorProtocol } from "../commands/coordinator"
import { CommandResponderProtocol, type CommandResponder } from "../commands/responder"
import { type SearchCommandResponder, SearchCommandResponderProtocol } from "../commands/search"
import { type Library, LibraryProtocol } from "../library"
import { getExtensionOrigin } from "../manifest"
import { type NotificationCenter, NotificationCenterProtocol } from "../notificationCenter"
import { type Panel, PanelProtocol } from "../panel"
import { type PlaybackEngine, PlaybackEngineProtocol } from "../playback/playbackEngine"
import { type Player, PlayerProtocol } from "../playback/player"
import { createDeferred, type Deferred } from "../utilities"

export interface HostExportsOptions {
    /** The manifest of the extension */
    readonly manifest: ExtensionManifest

    /** The broadcaster to use for communication with the extension */
    readonly broadcaster: RPCBroadcaster

    /** The extension. Available after handshake has completed */
    readonly extension: Deferred<Extension>
}

export interface HostExportsObject {
    readonly commandCoordinator: CommandCoordinator
    readonly notificationCenter: NotificationCenter
    readonly library: Library
    readonly player: Player
    readonly panel: Panel
}

export type HostExports =
    | HostExportsObject
    | ((options: HostExportsOptions) => Promise<HostExportsObject>)

async function implementExports(options: HostExportsOptions, exports: HostExports) {
    const { commandCoordinator, notificationCenter, library, player, panel } =
        typeof exports === "function" ? await exports(options) : exports
    return [
        implement(CommandCoordinatorProtocol, commandCoordinator),
        implement(NotificationCenterProtocol, notificationCenter),
        implement(LibraryProtocol, library),
        implement(PlayerProtocol, player),
        implement(PanelProtocol, panel),
    ]
}

export interface ExtensionWaitForConnectionOptions {
    /** The iframe element pointed at the extension */
    readonly iframe: HTMLIFrameElement

    /** The manifest of the extension */
    readonly manifest: ExtensionManifest

    /** The abort signal to use for the connection */
    readonly signal?: AbortSignal

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
        signal,
        broadcaster = new RPCBroadcaster(),
        exports,
        timeout = 30_000,
    }: ExtensionWaitForConnectionOptions): Promise<Extension> {
        const origin = getExtensionOrigin(manifest)
        const identity = manifest.id
        signal?.throwIfAborted()
        const transport = await MessageChannelTransport.handshake({
            role: "responder",
            iframe,
            origin,
            identity,
            timeout,
        })
        signal?.throwIfAborted()
        const extensionForExports = createDeferred<Extension>()
        const exportedObject = await implementExports(
            { manifest, broadcaster, extension: extensionForExports.deferred },
            exports,
        )
        const connection = new RPCConnection({
            transport,
            broadcaster,
            exportedObject,
        })
        signal?.throwIfAborted()
        const extension = new Extension(connection, manifest)
        extensionForExports.resolve(extension)
        return extension
    }

    /** @private */
    private constructor(
        readonly connection: RPCConnection,
        readonly manifest: ExtensionManifest,
    ) {}

    async disconnect(): Promise<void> {
        this.connection.invalidate()
    }

    async commandResponder(): Promise<CommandResponder> {
        return cast(CommandResponderProtocol, this.connection.remoteObject)
    }

    async playbackEngine(): Promise<PlaybackEngine> {
        return cast(PlaybackEngineProtocol, this.connection.remoteObject)
    }

    async searchCommandResponder(): Promise<SearchCommandResponder> {
        return cast(SearchCommandResponderProtocol, this.connection.remoteObject)
    }
}
