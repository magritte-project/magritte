import { LocalObject } from "@magritte/rpc"

import { ExtensionHostProxy } from "./hostProxy"

export interface HandshakeOptions {
    readonly extensionId: string
}

export interface HandshakeResult {
    readonly host: ExtensionHostProxy
}

/** Tracks whether the handshake has been performed */
let hasDoneHandshake = false

export async function handshake({ extensionId }: HandshakeOptions): Promise<HandshakeResult> {
    if (!window.top || window.top === window) {
        throw new Error("No extension host found")
    }
    if (hasDoneHandshake) {
        throw new Error("Handshake already performed")
    }
    hasDoneHandshake = true

    const host = new ExtensionHostProxy(window.top, {
        name: "root",
        object: new LocalObject("ExtensionRoot", []),
        children: [],
    })
    host._postMessage({ type: "handshake", extensionId })
    await host._waitForReady()
    return { host }
}
