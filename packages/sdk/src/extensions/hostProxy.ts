import {
    MessageChannelTransport,
    RemoteObject,
    type RPCObject,
    type RPCObjectExport,
    type RPCTransport,
} from "@magritte/rpc"

import { extensionMessageSchema, type HostMessage } from "./messages"

type ExtensionHostState =
    | { state: "pending"; root: RPCObjectExport; waiters: (() => void)[] }
    | { state: "ready"; serialNumber: string; transport: RPCTransport }

export class ExtensionHostProxy {
    private readonly _hostWindow: Window
    private _state: ExtensionHostState

    /** @private */
    constructor(hostWindow: Window, root: RPCObjectExport) {
        this._hostWindow = hostWindow
        this._state = { state: "pending", root, waiters: [] }

        window.addEventListener("message", (event) => {
            this._handleMessage(event)
        })
    }

    private _handleMessage(event: MessageEvent) {
        try {
            const data = extensionMessageSchema.parse(event.data)
            switch (data.type) {
                case "handshake":
                    if (this._state.state !== "pending") {
                        throw new Error("Handshake received but state is not pending")
                    }

                    if (event.ports.length !== 2) {
                        throw new Error("Handshake received but wrong number of ports given")
                    }
                    const { root, waiters } = this._state
                    this._state = {
                        state: "ready",
                        serialNumber: data.serialNumber,
                        transport: new MessageChannelTransport(
                            root,
                            event.ports[0],
                            event.ports[1],
                        ),
                    }
                    for (const waiter of waiters) {
                        waiter()
                    }
                    break
            }
        } catch (error) {
            console.error("*** Error when handling message from host", error, event)
        }
    }

    /** @private */
    _postMessage(message: HostMessage) {
        this._hostWindow.postMessage(message, "*")
    }

    _waitForReady(): Promise<void> {
        const state = this._state
        if (state.state === "ready") {
            return Promise.resolve()
        }
        return new Promise((resolve) => {
            state.waiters.push(resolve)
        })
    }

    async getObject(path: readonly string[]): Promise<RPCObject> {
        await this._waitForReady()
        if (this._state.state !== "ready") {
            throw new Error("Not ready")
        }
        return new RemoteObject(this._state.transport, path)
    }
}
