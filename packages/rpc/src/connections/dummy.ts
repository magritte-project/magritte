import type { RPCObject } from "../object"

import {
    dispatchMessage,
    type RPCConnection,
    type RPCConnectionMessage,
    type RPConnectionMessageReply,
} from "../connection"

function jsonify<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
}

export class DummyConnection implements RPCConnection {
    private isValid = true

    constructor(public readonly exportedObject: RPCObject) {}

    async send(message: RPCConnectionMessage): Promise<RPConnectionMessageReply> {
        if (!this.isValid) {
            throw new Error("Connection is invalid")
        }
        return jsonify(await dispatchMessage(jsonify(message), this.exportedObject))
    }

    invalidate(): void {
        this.isValid = false
    }
}
