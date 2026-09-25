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

export interface ExtensionListenOptions {
    /** The iframe element pointed at the extension */
    readonly iframe: HTMLIFrameElement

    /** The manifest of the extension */
    readonly manifest: ExtensionManifest

    /** Stops the listener when aborted, as if `stop()` had been called */
    readonly signal?: AbortSignal

    /** The exports to make available to the extension, resolved once per connection */
    readonly exports: HostExports
}

export interface ExtensionListenerNextOptions {
    /**
     * How long to wait for the extension to connect, in milliseconds.
     * Waits indefinitely when omitted.
     */
    readonly timeout?: number
}

/**
 * Answers connections from an extension's iframe for as long as it is open.
 *
 * An extension connects every time its document starts, which includes
 * reloads during development, so the listener stays open for the lifetime
 * of the iframe and produces a new `Extension` for each connection.
 */
export interface ExtensionListener {
    /**
     * Wait for the next connection from the extension.
     *
     * @returns The connected extension, or `null` once the listener is stopped.
     */
    next(options?: ExtensionListenerNextOptions): Promise<Extension | null>

    /** Stop answering connections from the extension. */
    stop(): void
}

export class Extension {
    /**
     * Start answering connections from an extension's iframe.
     *
     * The caller is responsible for stopping the listener once the iframe goes away,
     * either by calling `stop()` or by aborting the `signal` it was created with.
     */
    static listen({
        iframe,
        manifest,
        signal,
        exports,
    }: ExtensionListenOptions): ExtensionListener {
        signal?.throwIfAborted()
        const responder = MessageChannelTransport.listen({
            iframe,
            origin: getExtensionOrigin(manifest),
            identity: manifest.id,
        })
        const abort = () => responder.close()
        signal?.addEventListener("abort", abort, { once: true })
        return {
            async next({ timeout }: ExtensionListenerNextOptions = {}) {
                const transport = await responder.next({ timeout })
                if (transport === null) {
                    return null
                }
                // A broadcaster is invalidated along with its connection, so each gets its own
                const broadcaster = new RPCBroadcaster()
                const extensionForExports = createDeferred<Extension>()
                const exportedObject = await implementExports(
                    { manifest, broadcaster, extension: extensionForExports.deferred },
                    exports,
                )
                signal?.throwIfAborted()
                const connection = new RPCConnection({
                    transport,
                    broadcaster,
                    exportedObject,
                })
                const extension = new Extension(connection, manifest)
                extensionForExports.resolve(extension)
                return extension
            },
            stop() {
                signal?.removeEventListener("abort", abort)
                responder.close()
            },
        }
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
