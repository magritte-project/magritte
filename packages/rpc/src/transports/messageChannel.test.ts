import { describe, expect, it } from "vitest"
import z4 from "zod/v4"

import { LocalObject } from "@/localObject"
import { implement, protocol } from "@/protocol"
import { RemoteObject } from "@/remoteObject"

import { MessageChannelTransport } from "./messageChannel"

const Arithmetic = protocol("Arithmetic", {
    add: { input: z4.object({ a: z4.number(), b: z4.number() }), output: z4.number() },
    subtract: { input: z4.object({ a: z4.number(), b: z4.number() }), output: z4.number() },
})
const ArithmeticImplementation = implement(Arithmetic, {
    async add({ a, b }) {
        return a + b
    },
    async subtract({ a, b }) {
        return a - b
    },
})

const Inspectable = protocol("Inspectable", {
    inspect: { input: z4.any(), output: z4.string() },
})
const InspectableImplementation = implement(Inspectable, {
    async inspect() {
        return "inspectable"
    },
})

describe("MessageChannelTransport", () => {
    describe("#conformsToProtocol", () => {
        it("should return true if the object conforms to the protocol", async () => {
            const channel = new MessageChannel()
            const transport = new MessageChannelTransport(
                {
                    name: "root",
                    object: new LocalObject("root", [InspectableImplementation]),
                    children: [],
                },
                channel.port1,
                channel.port2,
            )
            const subject = new RemoteObject(transport, [])
            await expect(subject.conformsToProtocol(Inspectable.name)).resolves.toBe(true)
        })

        it("should return false if the object does not conform to the protocol", async () => {
            const channel = new MessageChannel()
            const transport = new MessageChannelTransport(
                {
                    name: "root",
                    object: new LocalObject("root", [InspectableImplementation]),
                    children: [],
                },
                channel.port1,
                channel.port2,
            )
            const subject = new RemoteObject(transport, [])
            await expect(subject.conformsToProtocol(Arithmetic.name)).resolves.toBe(false)
        })
    })

    describe("#invoke", () => {
        it("should be possible to invoke a method on any implemented protocol", async () => {
            const channel = new MessageChannel()
            const transport = new MessageChannelTransport(
                {
                    name: "root",
                    object: new LocalObject("root", [
                        InspectableImplementation,
                        ArithmeticImplementation,
                    ]),
                    children: [],
                },
                channel.port1,
                channel.port2,
            )
            const subject = new RemoteObject(transport, [])
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
