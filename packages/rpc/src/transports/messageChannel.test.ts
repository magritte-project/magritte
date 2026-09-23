import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import z4 from "zod/v4"

import { RPCConnection } from "../connection"
import { implement, protocol } from "../protocol"
import { MessageChannelTransport } from "./messageChannel"

const ArithmeticProtocol = protocol("Arithmetic", {
    add: { input: z4.object({ a: z4.number(), b: z4.number() }), output: z4.number() },
    subtract: { input: z4.object({ a: z4.number(), b: z4.number() }), output: z4.number() },
})
const ArithmeticImplementation = implement(ArithmeticProtocol, {
    async add({ a, b }) {
        return a + b
    },
    async subtract({ a, b }) {
        return a - b
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

const HOST_ORIGIN = "http://host.test"
const EXTENSION_ORIGIN = "http://extension.test"
const IDENTITY = "test.extension"

interface FakeWindow {
    postMessage: ReturnType<typeof vi.fn>
}

function createFakeWindow(): FakeWindow {
    return { postMessage: vi.fn() }
}

function asWindow(fake: FakeWindow): Window {
    return fake as unknown as Window
}

function asIframe(contentWindow: FakeWindow | null): HTMLIFrameElement {
    return { contentWindow } as unknown as HTMLIFrameElement
}

interface MessageInit {
    readonly data: unknown
    readonly origin: string
    readonly source: FakeWindow | null
    readonly ports?: readonly MessagePort[]
}

/** Deliver a message to whatever is listening on the stubbed window */
function deliver(init: MessageInit) {
    window.dispatchEvent(Object.assign(new Event("message"), { ports: [], ...init }))
}

function handshakeRequest(identity: string = IDENTITY) {
    return { type: "handshakeRequest", identity }
}

describe("MessageChannelConnection", () => {
    describe("#conformsToProtocol", () => {
        it("should return true if the object conforms to the protocol", async () => {
            const channel = new MessageChannel()
            const transport = new MessageChannelTransport(channel.port1, channel.port2)
            const connection = new RPCConnection({
                transport,
                exportedObject: [InspectableImplementation],
            })
            const subject = connection.remoteObject
            await expect(subject.implementsProtocol(InspectableProtocol.name)).resolves.toBe(true)
        })

        it("should return false if the object does not conform to the protocol", async () => {
            const channel = new MessageChannel()
            const transport = new MessageChannelTransport(channel.port1, channel.port2)
            const connection = new RPCConnection({
                transport,
                exportedObject: [InspectableImplementation],
            })
            const subject = connection.remoteObject
            await expect(subject.implementsProtocol(ArithmeticProtocol.name)).resolves.toBe(false)
        })
    })

    describe("#invoke", () => {
        it("should be possible to invoke a method on any implemented protocol", async () => {
            const channel = new MessageChannel()
            const transport = new MessageChannelTransport(channel.port1, channel.port2)
            const connection = new RPCConnection({
                transport,
                exportedObject: [InspectableImplementation, ArithmeticImplementation],
            })
            const subject = connection.remoteObject
            await expect(
                subject.invoke(InspectableImplementation.name, "inspect", undefined),
            ).resolves.toStrictEqual("inspectable")
            await expect(
                subject.invoke(ArithmeticImplementation.name, "add", { a: 12, b: 12 }),
            ).resolves.toStrictEqual(24)
            await expect(
                subject.invoke(ArithmeticImplementation.name, "subtract", { a: 20, b: 5 }),
            ).resolves.toStrictEqual(15)
        })
    })
})

describe("MessageChannelResponder", () => {
    beforeEach(() => {
        vi.stubGlobal("window", new EventTarget())
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.useRealTimers()
    })

    it("should answer a request from its iframe with a pair of ports", async () => {
        const contentWindow = createFakeWindow()
        const responder = MessageChannelTransport.listen({
            iframe: asIframe(contentWindow),
            origin: EXTENSION_ORIGIN,
            identity: IDENTITY,
        })
        const pending = responder.next()
        deliver({ data: handshakeRequest(), origin: EXTENSION_ORIGIN, source: contentWindow })

        const transport = await pending
        expect(transport).toBeInstanceOf(MessageChannelTransport)
        expect(contentWindow.postMessage).toHaveBeenCalledTimes(1)
        const [message, targetOrigin, transfer] = contentWindow.postMessage.mock.calls[0]
        expect(message).toStrictEqual({ type: "handshakeResponse" })
        expect(targetOrigin).toBe(EXTENSION_ORIGIN)
        expect(transfer).toHaveLength(2)
        responder.close()
    })

    it("should keep answering so a reloaded iframe can connect again", async () => {
        const contentWindow = createFakeWindow()
        const responder = MessageChannelTransport.listen({
            iframe: asIframe(contentWindow),
            origin: EXTENSION_ORIGIN,
            identity: IDENTITY,
        })

        const first = responder.next()
        deliver({ data: handshakeRequest(), origin: EXTENSION_ORIGIN, source: contentWindow })
        const second = responder.next()
        deliver({ data: handshakeRequest(), origin: EXTENSION_ORIGIN, source: contentWindow })

        const transports = await Promise.all([first, second])
        expect(transports[0]).toBeInstanceOf(MessageChannelTransport)
        expect(transports[1]).toBeInstanceOf(MessageChannelTransport)
        expect(transports[0]).not.toBe(transports[1])
        expect(contentWindow.postMessage).toHaveBeenCalledTimes(2)
        responder.close()
    })

    it("should hold a connection made before anyone asked for it", async () => {
        const contentWindow = createFakeWindow()
        const responder = MessageChannelTransport.listen({
            iframe: asIframe(contentWindow),
            origin: EXTENSION_ORIGIN,
            identity: IDENTITY,
        })
        deliver({ data: handshakeRequest(), origin: EXTENSION_ORIGIN, source: contentWindow })
        expect(contentWindow.postMessage).toHaveBeenCalledTimes(1)

        await expect(responder.next()).resolves.toBeInstanceOf(MessageChannelTransport)
        responder.close()
    })

    it("should ignore requests from another window with the same origin", async () => {
        vi.useFakeTimers()
        const contentWindow = createFakeWindow()
        const otherWindow = createFakeWindow()
        const responder = MessageChannelTransport.listen({
            iframe: asIframe(contentWindow),
            origin: EXTENSION_ORIGIN,
            identity: IDENTITY,
        })
        const pending = responder.next({ timeout: 1_000 })
        deliver({ data: handshakeRequest(), origin: EXTENSION_ORIGIN, source: otherWindow })
        vi.advanceTimersByTime(1_000)

        await expect(pending).rejects.toThrow("Handshake timeout")
        expect(otherWindow.postMessage).not.toHaveBeenCalled()
        expect(contentWindow.postMessage).not.toHaveBeenCalled()
        responder.close()
    })

    it("should ignore messages from the wrong origin and messages that are not requests", async () => {
        vi.useFakeTimers()
        const contentWindow = createFakeWindow()
        const responder = MessageChannelTransport.listen({
            iframe: asIframe(contentWindow),
            origin: EXTENSION_ORIGIN,
            identity: IDENTITY,
        })
        const pending = responder.next({ timeout: 1_000 })
        deliver({ data: handshakeRequest(), origin: HOST_ORIGIN, source: contentWindow })
        deliver({
            data: { type: "somethingElse" },
            origin: EXTENSION_ORIGIN,
            source: contentWindow,
        })
        deliver({ data: "not an object", origin: EXTENSION_ORIGIN, source: contentWindow })
        vi.advanceTimersByTime(1_000)

        await expect(pending).rejects.toThrow("Handshake timeout")
        expect(contentWindow.postMessage).not.toHaveBeenCalled()
        responder.close()
    })

    it("should reject a request with the wrong identity", async () => {
        const contentWindow = createFakeWindow()
        const responder = MessageChannelTransport.listen({
            iframe: asIframe(contentWindow),
            origin: EXTENSION_ORIGIN,
            identity: IDENTITY,
        })
        const pending = responder.next()
        deliver({
            data: handshakeRequest("someone.else"),
            origin: EXTENSION_ORIGIN,
            source: contentWindow,
        })

        await expect(pending).rejects.toThrow("Identity mismatch")
        expect(contentWindow.postMessage).not.toHaveBeenCalled()
        responder.close()
    })

    it("should resolve with null and stop answering once closed", async () => {
        const contentWindow = createFakeWindow()
        const responder = MessageChannelTransport.listen({
            iframe: asIframe(contentWindow),
            origin: EXTENSION_ORIGIN,
            identity: IDENTITY,
        })
        const pending = responder.next()
        responder.close()

        await expect(pending).resolves.toBeNull()
        deliver({ data: handshakeRequest(), origin: EXTENSION_ORIGIN, source: contentWindow })
        expect(contentWindow.postMessage).not.toHaveBeenCalled()
        await expect(responder.next()).resolves.toBeNull()
    })

    it("should not allow two callers to wait at once", async () => {
        const responder = MessageChannelTransport.listen({
            iframe: asIframe(createFakeWindow()),
            origin: EXTENSION_ORIGIN,
            identity: IDENTITY,
        })
        const first = responder.next()
        await expect(responder.next()).rejects.toThrow("Already waiting for a connection")
        responder.close()
        await expect(first).resolves.toBeNull()
    })
})

describe("MessageChannelTransport.handshake", () => {
    beforeEach(() => {
        vi.stubGlobal("window", new EventTarget())
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.useRealTimers()
    })

    it("should only accept a response from the parent window", async () => {
        vi.useFakeTimers()
        const parentWindow = createFakeWindow()
        const otherWindow = createFakeWindow()
        const pending = MessageChannelTransport.handshake({
            parentWindow: asWindow(parentWindow),
            origin: HOST_ORIGIN,
            identity: IDENTITY,
            timeout: 1_000,
        })
        expect(parentWindow.postMessage).toHaveBeenCalledWith(handshakeRequest(), HOST_ORIGIN)

        const channels = MessageChannelTransport.createChannels()
        const ports = [channels.remotePorts.send, channels.remotePorts.receive]
        deliver({
            data: { type: "handshakeResponse" },
            origin: HOST_ORIGIN,
            source: otherWindow,
            ports,
        })
        deliver({ data: { type: "unrelated" }, origin: HOST_ORIGIN, source: parentWindow, ports })
        vi.advanceTimersByTime(1_000)

        await expect(pending).rejects.toThrow("Handshake timeout")
        for (const port of ports) {
            port.close()
        }
        channels.localPorts.send.close()
        channels.localPorts.receive.close()
    })

    it("should connect a responder and a requester so they can exchange calls", async () => {
        const hostWindow = createFakeWindow()
        const extensionWindow = createFakeWindow()
        // Stand in for the browser, which would carry each message to the other window
        hostWindow.postMessage.mockImplementation((data: unknown, origin: string) => {
            expect(origin).toBe(HOST_ORIGIN)
            deliver({ data, origin: EXTENSION_ORIGIN, source: extensionWindow })
        })
        extensionWindow.postMessage.mockImplementation(
            (data: unknown, origin: string, ports: readonly MessagePort[]) => {
                expect(origin).toBe(EXTENSION_ORIGIN)
                deliver({ data, origin: HOST_ORIGIN, source: hostWindow, ports })
            },
        )

        const responder = MessageChannelTransport.listen({
            iframe: asIframe(extensionWindow),
            origin: EXTENSION_ORIGIN,
            identity: IDENTITY,
        })
        const hostTransport = responder.next({ timeout: 1_000 })
        const extensionTransport = await MessageChannelTransport.handshake({
            parentWindow: asWindow(hostWindow),
            origin: HOST_ORIGIN,
            identity: IDENTITY,
            timeout: 1_000,
        })
        const host = new RPCConnection({
            transport: (await hostTransport)!,
            exportedObject: [ArithmeticImplementation],
        })
        const extension = new RPCConnection({
            transport: extensionTransport,
            exportedObject: [InspectableImplementation],
        })

        await expect(
            extension.remoteObject.invoke(ArithmeticProtocol.name, "add", { a: 2, b: 3 }),
        ).resolves.toBe(5)
        await expect(
            host.remoteObject.invoke(InspectableProtocol.name, "inspect", undefined),
        ).resolves.toBe("inspectable")

        host.invalidate()
        extension.invalidate()
        responder.close()
    })
})
