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
    constructor(public readonly exportedObject: RPCObject) {}

    async send(message: RPCConnectionMessage): Promise<RPConnectionMessageReply> {
        return jsonify(await dispatchMessage(jsonify(message), this.exportedObject))
    }
}
