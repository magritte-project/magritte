import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import z4 from "zod/v4"

import { defineBroadcast, RPCBroadcaster } from "./broadcasts"
import { RPCConnection, type RPCConnectionEvent } from "./connection"
import { implement, protocol } from "./protocol"
import type { RPCTransport, RPCTransportMessage } from "./transport"

const ArithmeticProtocol = protocol("Arithmetic", {
    add: { input: z4.object({ a: z4.number(), b: z4.number() }), output: z4.number() },
    divide: { input: z4.object({ a: z4.number(), b: z4.number() }), output: z4.number() },
})
const ArithmeticImplementation = implement(ArithmeticProtocol, {
    async add({ a, b }) {
        return a + b
    },
    async divide({ a, b }) {
        if (b === 0) {
            throw new RangeError("Division by zero")
        }
        return a / b
    },
})

const InspectableProtocol = protocol("Inspectable", {
    inspect: { input: z4.any(), output: z4.string() },
})
const InspectableImplementation = implement(InspectableProtocol, {
    async inspect() {
        return "inspectable"
    },
})

const Pinged = defineBroadcast("Test", "pinged", z4.object({ count: z4.number() }))

/** Wait for all pending microtasks and macrotasks to settle. */
function flush(): Promise<void> {
    return new Promise((resolve) => setImmediate(resolve))
}

/**
 * A transport which records outgoing messages and allows
 * tests to deliver arbitrary incoming messages.
 */
class MockTransport implements RPCTransport {
    onmessage: ((message: RPCTransportMessage) => void) | null = null
    readonly sent: RPCTransportMessage[] = []
    invalidateCount = 0

    postMessage(message: RPCTransportMessage): void {
        this.sent.push(message)
    }

    invalidate(): void {
        this.invalidateCount += 1
        this.onmessage = null
    }

    deliver(message: RPCTransportMessage): void {
        this.onmessage?.(message)
    }

    lastCommand(): Extract<RPCTransportMessage, { type: "command" }> {
        const commands = this.sent.filter((message) => message.type === "command")
        const last = commands.at(-1)
        if (last === undefined) {
            throw new Error("No command was sent")
        }
        return last
    }
}

/**
 * A transport which asynchronously delivers messages to a peer
 * transport, round-tripping them through JSON along the way.
 */
class PairedTransport implements RPCTransport {
    onmessage: ((message: RPCTransportMessage) => void) | null = null
    peer: PairedTransport | null = null

    static pair(): [PairedTransport, PairedTransport] {
        const a = new PairedTransport()
        const b = new PairedTransport()
        a.peer = b
        b.peer = a
        return [a, b]
    }

    postMessage(message: RPCTransportMessage): void {
        const peer = this.peer
        const serialized = JSON.stringify(message)
        queueMicrotask(() => {
            peer?.onmessage?.(JSON.parse(serialized) as RPCTransportMessage)
        })
    }

    invalidate(): void {
        this.onmessage = null
        this.peer = null
    }
}

function makePair({
    leftExports = [],
    rightExports = [],
    timeout,
}: {
    leftExports?: ConstructorParameters<typeof RPCConnection>[0]["exportedObject"]
    rightExports?: ConstructorParameters<typeof RPCConnection>[0]["exportedObject"]
    timeout?: number
} = {}) {
    const [leftTransport, rightTransport] = PairedTransport.pair()
    const left = new RPCConnection({
        transport: leftTransport,
        exportedObject: leftExports,
        timeout,
    })
    const right = new RPCConnection({
        transport: rightTransport,
        exportedObject: rightExports,
        timeout,
    })
    return { left, right }
}

describe("RPCConnection", () => {
    describe("constructor", () => {
        it("should start out valid", () => {
            const connection = new RPCConnection({
                transport: new MockTransport(),
                exportedObject: [],
            })
            expect(connection.isValid).toBe(true)
        })

        it("should default the timeout to 7 seconds", () => {
            const connection = new RPCConnection({
                transport: new MockTransport(),
                exportedObject: [],
            })
            expect(connection.timeout).toBe(7_000)
        })

        it("should use the timeout passed in the options", () => {
            const connection = new RPCConnection({
                transport: new MockTransport(),
                exportedObject: [],
                timeout: 250,
            })
            expect(connection.timeout).toBe(250)
        })

        it("should use the broadcaster passed in the options", () => {
            const broadcaster = new RPCBroadcaster()
            const connection = new RPCConnection({
                transport: new MockTransport(),
                exportedObject: [],
                broadcaster,
            })
            expect(connection.broadcaster).toBe(broadcaster)
        })

        it("should create a broadcaster if none is passed in the options", () => {
            const connection = new RPCConnection({
                transport: new MockTransport(),
                exportedObject: [],
            })
            expect(connection.broadcaster).toBeInstanceOf(RPCBroadcaster)
            expect(connection.broadcaster.isValid).toBe(true)
        })

        it("should install a message handler on the transport", () => {
            const transport = new MockTransport()
            void new RPCConnection({ transport, exportedObject: [] })
            expect(transport.onmessage).toBeTypeOf("function")
        })
    })

    describe("#exportedObject", () => {
        it("should expose the exported protocol implementations locally", async () => {
            const connection = new RPCConnection({
                transport: new MockTransport(),
                exportedObject: [ArithmeticImplementation, InspectableImplementation],
            })
            await expect(connection.exportedObject.getProtocolNames()).resolves.toStrictEqual([
                ArithmeticProtocol.name,
                InspectableProtocol.name,
            ])
            await expect(
                connection.exportedObject.invoke(ArithmeticProtocol.name, "add", { a: 1, b: 2 }),
            ).resolves.toBe(3)
        })
    })

    describe("#remoteObject", () => {
        it("should return the protocol names exported by the remote side", async () => {
            const { left } = makePair({
                rightExports: [ArithmeticImplementation, InspectableImplementation],
            })
            await expect(left.remoteObject.getProtocolNames()).resolves.toStrictEqual([
                ArithmeticProtocol.name,
                InspectableProtocol.name,
            ])
        })

        it("should report whether the remote side implements a protocol", async () => {
            const { left } = makePair({ rightExports: [InspectableImplementation] })
            await expect(
                left.remoteObject.implementsProtocol(InspectableProtocol.name),
            ).resolves.toBe(true)
            await expect(
                left.remoteObject.implementsProtocol(ArithmeticProtocol.name),
            ).resolves.toBe(false)
        })

        it("should invoke methods on the remote side", async () => {
            const { left } = makePair({ rightExports: [ArithmeticImplementation] })
            await expect(
                left.remoteObject.invoke(ArithmeticProtocol.name, "add", { a: 2, b: 3 }),
            ).resolves.toBe(5)
        })

        it("should work in both directions", async () => {
            const { left, right } = makePair({
                leftExports: [InspectableImplementation],
                rightExports: [ArithmeticImplementation],
            })
            await expect(right.remoteObject.getProtocolNames()).resolves.toStrictEqual([
                InspectableProtocol.name,
            ])
            await expect(left.remoteObject.getProtocolNames()).resolves.toStrictEqual([
                ArithmeticProtocol.name,
            ])
        })

        it("should support many concurrent invocations", async () => {
            const { left } = makePair({ rightExports: [ArithmeticImplementation] })
            const results = await Promise.all(
                Array.from({ length: 20 }, (_, i) =>
                    left.remoteObject.invoke(ArithmeticProtocol.name, "add", { a: i, b: i }),
                ),
            )
            expect(results).toStrictEqual(Array.from({ length: 20 }, (_, i) => i * 2))
        })

        it("should reject with the message of an error thrown by the remote implementation", async () => {
            const { left } = makePair({ rightExports: [ArithmeticImplementation] })
            await expect(
                left.remoteObject.invoke(ArithmeticProtocol.name, "divide", { a: 1, b: 0 }),
            ).rejects.toThrow("Division by zero")
        })

        it("should reject when invoking a protocol the remote side does not implement", async () => {
            const { left } = makePair({ rightExports: [InspectableImplementation] })
            await expect(
                left.remoteObject.invoke(ArithmeticProtocol.name, "add", { a: 1, b: 2 }),
            ).rejects.toThrow(`Protocol ${ArithmeticProtocol.name} not found`)
        })

        it("should reject when invoking a selector the remote side does not implement", async () => {
            const { left } = makePair({ rightExports: [ArithmeticImplementation] })
            await expect(
                left.remoteObject.invoke(ArithmeticProtocol.name, "multiply", { a: 1, b: 2 }),
            ).rejects.toThrow(`Selector multiply not implemented by ${ArithmeticProtocol.name}`)
        })

        it("should reject when the remote side fails to validate parameters", async () => {
            const { left } = makePair({ rightExports: [ArithmeticImplementation] })
            await expect(
                left.remoteObject.invoke(ArithmeticProtocol.name, "add", { a: "1", b: 2 }),
            ).rejects.toThrow()
        })

        it("should reject when the reply type does not match the command type", async () => {
            const transport = new MockTransport()
            const connection = new RPCConnection({ transport, exportedObject: [] })
            const result = connection.remoteObject.getProtocolNames()
            const { id } = transport.lastCommand()
            transport.deliver({
                type: "result",
                id,
                result: { type: "object.implementsProtocol", conforms: true },
            })
            await expect(result).rejects.toThrow(
                "Reply to object.getProtocolNames message was mismatched object.implementsProtocol",
            )
        })

        it("should send commands with unique ids", async () => {
            const transport = new MockTransport()
            const connection = new RPCConnection({ transport, exportedObject: [] })
            void connection.remoteObject.getProtocolNames().catch(() => {})
            void connection.remoteObject.getProtocolNames().catch(() => {})
            const ids = transport.sent.map((message) => (message as { id: string }).id)
            expect(ids).toHaveLength(2)
            expect(new Set(ids).size).toBe(2)
            connection.invalidate()
        })

        it("should ignore results for unknown ids", async () => {
            const transport = new MockTransport()
            const connection = new RPCConnection({ transport, exportedObject: [] })
            const result = connection.remoteObject.implementsProtocol("Anything")
            const { id } = transport.lastCommand()
            transport.deliver({
                type: "result",
                id: "not-a-real-id",
                result: { type: "object.implementsProtocol", conforms: false },
            })
            transport.deliver({
                type: "result",
                id,
                result: { type: "object.implementsProtocol", conforms: true },
            })
            await expect(result).resolves.toBe(true)
        })
    })

    describe("handling commands", () => {
        it("should reply to commands from the remote side with results", async () => {
            const transport = new MockTransport()
            void new RPCConnection({ transport, exportedObject: [ArithmeticImplementation] })
            transport.deliver({
                type: "command",
                id: "1",
                command: {
                    type: "object.invoke",
                    protocolName: ArithmeticProtocol.name,
                    selector: "add",
                    parameters: { a: 40, b: 2 },
                },
            })
            await flush()
            expect(transport.sent).toStrictEqual([
                { type: "result", id: "1", result: { type: "object.invoke", result: 42 } },
            ])
        })

        it("should reply with an error result when the command fails", async () => {
            const transport = new MockTransport()
            void new RPCConnection({ transport, exportedObject: [ArithmeticImplementation] })
            transport.deliver({
                type: "command",
                id: "2",
                command: {
                    type: "object.invoke",
                    protocolName: ArithmeticProtocol.name,
                    selector: "divide",
                    parameters: { a: 1, b: 0 },
                },
            })
            await flush()
            expect(transport.sent).toStrictEqual([
                {
                    type: "result",
                    id: "2",
                    result: { type: "error", name: "RangeError", message: "Division by zero" },
                },
            ])
        })

        it("should reply with an error result for unknown command types", async () => {
            const transport = new MockTransport()
            void new RPCConnection({ transport, exportedObject: [] })
            transport.deliver({
                type: "command",
                id: "3",
                command: { type: "object.bogus" } as unknown as Extract<
                    RPCTransportMessage,
                    { type: "command" }
                >["command"],
            })
            await flush()
            expect(transport.sent).toStrictEqual([
                {
                    type: "result",
                    id: "3",
                    result: { type: "error", name: "Error", message: "Unknown message type" },
                },
            ])
        })
    })

    describe("broadcasts", () => {
        it("should post broadcasts sent through the broadcaster to the transport", () => {
            const transport = new MockTransport()
            const connection = new RPCConnection({ transport, exportedObject: [] })
            connection.broadcaster.send(Pinged, { count: 7 })
            expect(transport.sent).toStrictEqual([
                { type: "broadcast", channel: "Test", what: "pinged", data: { count: 7 } },
            ])
        })

        it("should deliver incoming broadcasts to the broadcaster's subscribers", () => {
            const transport = new MockTransport()
            const connection = new RPCConnection({ transport, exportedObject: [] })
            const received: unknown[] = []
            connection.broadcaster.subscribe(Pinged, (data) => received.push(data))
            transport.deliver({
                type: "broadcast",
                channel: "Test",
                what: "pinged",
                data: { count: 3 },
            })
            expect(received).toStrictEqual([{ count: 3 }])
        })

        it("should deliver broadcasts end-to-end between connections", async () => {
            const { left, right } = makePair()
            const received: unknown[] = []
            right.broadcaster.subscribe(Pinged, (data) => received.push(data))
            left.broadcaster.send(Pinged, { count: 1 })
            left.broadcaster.send(Pinged, { count: 2 })
            await flush()
            expect(received).toStrictEqual([{ count: 1 }, { count: 2 }])
        })

        it("should not deliver broadcasts back to the sending side", async () => {
            const { left } = makePair()
            const received: unknown[] = []
            left.broadcaster.subscribe(Pinged, (data) => received.push(data))
            left.broadcaster.send(Pinged, { count: 1 })
            await flush()
            expect(received).toStrictEqual([])
        })
    })

    describe("timeouts", () => {
        beforeEach(() => {
            vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it("should reject operations which take longer than the timeout", async () => {
            const transport = new MockTransport()
            const connection = new RPCConnection({ transport, exportedObject: [], timeout: 100 })
            const result = connection.remoteObject.getProtocolNames()
            const assertion = expect(result).rejects.toThrow("Operation timed out")
            await vi.advanceTimersByTimeAsync(100)
            await assertion
        })

        it("should not reject operations which complete before the timeout", async () => {
            const transport = new MockTransport()
            const connection = new RPCConnection({ transport, exportedObject: [], timeout: 100 })
            const result = connection.remoteObject.getProtocolNames()
            await vi.advanceTimersByTimeAsync(99)
            const { id } = transport.lastCommand()
            transport.deliver({
                type: "result",
                id,
                result: { type: "object.getProtocolNames", protocolNames: ["A"] },
            })
            await expect(result).resolves.toStrictEqual(["A"])
            expect(vi.getTimerCount()).toBe(0)
        })

        it("should dispatch a timeout event to subscribers", async () => {
            const transport = new MockTransport()
            const connection = new RPCConnection({ transport, exportedObject: [], timeout: 100 })
            const events: RPCConnectionEvent[] = []
            connection.subscribe((event) => events.push(event))
            const result = connection.remoteObject.getProtocolNames().catch(() => {})
            await vi.advanceTimersByTimeAsync(100)
            await result
            expect(events).toStrictEqual([{ type: "timeout" }])
        })

        it("should leave the connection valid after a timeout", async () => {
            const transport = new MockTransport()
            const connection = new RPCConnection({ transport, exportedObject: [], timeout: 100 })
            const result = connection.remoteObject.getProtocolNames().catch(() => {})
            await vi.advanceTimersByTimeAsync(100)
            await result
            expect(connection.isValid).toBe(true)
        })

        it("should ignore replies which arrive after the timeout", async () => {
            const transport = new MockTransport()
            const connection = new RPCConnection({ transport, exportedObject: [], timeout: 100 })
            const result = connection.remoteObject.getProtocolNames()
            const assertion = expect(result).rejects.toThrow("Operation timed out")
            await vi.advanceTimersByTimeAsync(100)
            await assertion
            const { id } = transport.lastCommand()
            expect(() =>
                transport.deliver({
                    type: "result",
                    id,
                    result: { type: "object.getProtocolNames", protocolNames: [] },
                }),
            ).not.toThrow()
        })

        it("should use the default timeout of 7 seconds", async () => {
            const transport = new MockTransport()
            const connection = new RPCConnection({ transport, exportedObject: [] })
            let settled = false
            const result = connection.remoteObject.getProtocolNames().catch((error: unknown) => {
                settled = true
                throw error
            })
            const assertion = expect(result).rejects.toThrow("Operation timed out")
            await vi.advanceTimersByTimeAsync(6_999)
            expect(settled).toBe(false)
            await vi.advanceTimersByTimeAsync(1)
            await assertion
        })

        describe("#withTimeout", () => {
            it("should override the timeout for the duration of the operation", async () => {
                const transport = new MockTransport()
                const connection = new RPCConnection({ transport, exportedObject: [] })
                let observed = 0
                await connection.withTimeout(50, async () => {
                    observed = connection.timeout
                })
                expect(observed).toBe(50)
                expect(connection.timeout).toBe(7_000)
            })

            it("should apply the timeout to operations started within it", async () => {
                const transport = new MockTransport()
                const connection = new RPCConnection({ transport, exportedObject: [] })
                const result = connection.withTimeout(50, () =>
                    connection.remoteObject.getProtocolNames(),
                )
                const assertion = expect(result).rejects.toThrow("Operation timed out")
                await vi.advanceTimersByTimeAsync(50)
                await assertion
            })

            it("should return the result of the operation", async () => {
                const connection = new RPCConnection({
                    transport: new MockTransport(),
                    exportedObject: [],
                })
                await expect(connection.withTimeout(50, async () => "done")).resolves.toBe("done")
            })

            it("should restore the timeout if the operation throws", async () => {
                const connection = new RPCConnection({
                    transport: new MockTransport(),
                    exportedObject: [],
                    timeout: 300,
                })
                await expect(
                    connection.withTimeout(50, async () => {
                        throw new Error("boom")
                    }),
                ).rejects.toThrow("boom")
                expect(connection.timeout).toBe(300)
            })
        })
    })

    describe("#invalidate", () => {
        it("should mark the connection as invalid", () => {
            const connection = new RPCConnection({
                transport: new MockTransport(),
                exportedObject: [],
            })
            connection.invalidate()
            expect(connection.isValid).toBe(false)
        })

        it("should notify the remote side and invalidate the transport", () => {
            const transport = new MockTransport()
            const connection = new RPCConnection({ transport, exportedObject: [] })
            connection.invalidate()
            expect(transport.sent).toStrictEqual([{ type: "invalidate" }])
            expect(transport.invalidateCount).toBe(1)
        })

        it("should invalidate the broadcaster", () => {
            const connection = new RPCConnection({
                transport: new MockTransport(),
                exportedObject: [],
            })
            const onInvalidated = vi.fn()
            connection.broadcaster.subscribe(RPCBroadcaster.invalidated, onInvalidated)
            connection.invalidate()
            expect(connection.broadcaster.isValid).toBe(false)
            expect(onInvalidated).toHaveBeenCalledOnce()
        })

        it("should reject all pending operations", async () => {
            const transport = new MockTransport()
            const connection = new RPCConnection({ transport, exportedObject: [] })
            const first = connection.remoteObject.getProtocolNames()
            const second = connection.remoteObject.implementsProtocol("Anything")
            connection.invalidate()
            await expect(first).rejects.toThrow("Connection invalidated")
            await expect(second).rejects.toThrow("Connection invalidated")
        })

        it("should reject operations started after invalidation", async () => {
            const transport = new MockTransport()
            const connection = new RPCConnection({ transport, exportedObject: [] })
            connection.invalidate()
            await expect(connection.remoteObject.getProtocolNames()).rejects.toThrow(
                "Connection is invalid",
            )
            expect(transport.sent).toStrictEqual([{ type: "invalidate" }])
        })

        it("should dispatch an invalidated event that did not come from the remote side", () => {
            const connection = new RPCConnection({
                transport: new MockTransport(),
                exportedObject: [],
            })
            const events: RPCConnectionEvent[] = []
            connection.subscribe((event) => events.push(event))
            connection.invalidate()
            expect(events).toStrictEqual([{ type: "invalidated", fromRemoteSide: false }])
        })

        it("should only perform invalidation once", () => {
            const transport = new MockTransport()
            const connection = new RPCConnection({ transport, exportedObject: [] })
            const events: RPCConnectionEvent[] = []
            connection.subscribe((event) => events.push(event))
            connection.invalidate()
            connection.invalidate()
            expect(transport.invalidateCount).toBe(1)
            expect(events).toHaveLength(1)
        })

        it("should invalidate the remote side of the connection", async () => {
            const { left, right } = makePair()
            const events: RPCConnectionEvent[] = []
            right.subscribe((event) => events.push(event))
            left.invalidate()
            await flush()
            expect(right.isValid).toBe(false)
            expect(right.broadcaster.isValid).toBe(false)
            expect(events).toStrictEqual([{ type: "invalidated", fromRemoteSide: true }])
        })

        it("should reject pending operations on the remote side", async () => {
            const transport = new MockTransport()
            const connection = new RPCConnection({ transport, exportedObject: [] })
            const result = connection.remoteObject.getProtocolNames()
            transport.deliver({ type: "invalidate" })
            await expect(result).rejects.toThrow("Connection invalidated")
            expect(connection.isValid).toBe(false)
            expect(transport.invalidateCount).toBe(1)
        })
    })

    describe("#subscribe", () => {
        it("should stop delivering events after unsubscribing", () => {
            const connection = new RPCConnection({
                transport: new MockTransport(),
                exportedObject: [],
            })
            const subscriber = vi.fn()
            const unsubscribe = connection.subscribe(subscriber)
            unsubscribe()
            connection.invalidate()
            expect(subscriber).not.toHaveBeenCalled()
        })

        it("should tolerate unsubscribing more than once", () => {
            const connection = new RPCConnection({
                transport: new MockTransport(),
                exportedObject: [],
            })
            const first = vi.fn()
            const second = vi.fn()
            const unsubscribeFirst = connection.subscribe(first)
            connection.subscribe(second)
            unsubscribeFirst()
            unsubscribeFirst()
            connection.invalidate()
            expect(first).not.toHaveBeenCalled()
            expect(second).toHaveBeenCalledOnce()
        })

        it("should deliver events to subscribers even if an earlier one throws", () => {
            const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
            try {
                const connection = new RPCConnection({
                    transport: new MockTransport(),
                    exportedObject: [],
                })
                const after = vi.fn()
                connection.subscribe(() => {
                    throw new Error("subscriber failure")
                })
                connection.subscribe(after)
                connection.invalidate()
                expect(after).toHaveBeenCalledOnce()
                expect(consoleError).toHaveBeenCalled()
            } finally {
                consoleError.mockRestore()
            }
        })

        it("should allow subscribers to unsubscribe while events are dispatched", async () => {
            vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
            try {
                const connection = new RPCConnection({
                    transport: new MockTransport(),
                    exportedObject: [],
                    timeout: 10,
                })
                const after = vi.fn()
                const unsubscribe = connection.subscribe(() => unsubscribe())
                connection.subscribe(after)
                const result = connection.remoteObject.getProtocolNames().catch(() => {})
                await vi.advanceTimersByTimeAsync(10)
                await result
                expect(after).toHaveBeenCalledOnce()
            } finally {
                vi.useRealTimers()
            }
        })

        it("should not register subscribers on an invalid connection", () => {
            const connection = new RPCConnection({
                transport: new MockTransport(),
                exportedObject: [],
            })
            connection.invalidate()
            const subscriber = vi.fn()
            const unsubscribe = connection.subscribe(subscriber)
            expect(() => unsubscribe()).not.toThrow()
            connection.invalidate()
            expect(subscriber).not.toHaveBeenCalled()
        })
    })
})
