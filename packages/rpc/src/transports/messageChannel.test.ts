import { describe, expect, it } from "vitest"
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
