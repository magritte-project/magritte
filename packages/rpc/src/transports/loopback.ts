import type { RPCTransport, RPCTransportMessage } from "../transport"

function jsonify<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
}

export class LoopbackTransport implements RPCTransport {
    onmessage: ((message: RPCTransportMessage) => void) | null = null

    postMessage(message: RPCTransportMessage): void {
        this.onmessage?.(jsonify(message))
    }

    invalidate(): void {
        this.onmessage = null
    }
}
