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

export class Extension {
    /** @private */
    constructor(public readonly connection: RPCConnection) {}

    async disconnect(): Promise<void> {
        this.connection.invalidate()
    }

    async playbackEngine(): Promise<PlaybackEngine> {
        return cast(PlaybackEngineProtocol, this.connection.remoteObject)
    }
}

export async function waitForExtensionConnection({
    iframe,
    manifest,
    broadcaster,
    exports,
    timeout = 30_000,
}: WaitForExtensionConnectionOptions): Promise<Extension> {
    const origin = getExtensionOrigin(manifest)
    const identity = manifest.id
    const transport = await MessageChannelTransport.handshake({
        role: "responder",
        iframe,
        origin,
        identity,
        timeout,
    })
    const exportedObject = [...implementExports(exports)]
    const connection = new RPCConnection({
        transport,
        broadcaster,
        exportedObject,
    })
    return new Extension(connection)
}
