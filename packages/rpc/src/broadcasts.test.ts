import { defineBroadcast } from "@magritte/rpc"
import { describe, expect, it, vi } from "vitest"
import z4 from "zod/v4"

import { RPCBroadcaster } from "./broadcasts"

const ArithmeticAdded = defineBroadcast("Arithmetic", "added", z4.number())
const ArithmeticSubtracted = defineBroadcast("Arithmetic", "subtracted", z4.number())

describe("RPCBroadcaster", () => {
    it("should route broadcasts to subscribers", () => {
        const subject = new RPCBroadcaster()
        subject._connection_onsend = subject._connection_receive
        const addedSubscriber = vi.fn()
        const subtractedSubscriber = vi.fn()
        subject.subscribe(ArithmeticAdded, addedSubscriber)
        subject.subscribe(ArithmeticSubtracted, subtractedSubscriber)
        subject.send(ArithmeticAdded, 5)
        subject.send(ArithmeticSubtracted, 3)
        expect(addedSubscriber).toHaveBeenCalledWith(5)
        expect(subtractedSubscriber).toHaveBeenCalledWith(3)
    })

    it("should be possible to unsubscribe", () => {
        const subject = new RPCBroadcaster()
        subject._connection_onsend = subject._connection_receive
        const addedSubscriber = vi.fn()
        const subtractedSubscriber = vi.fn()
        const addedSubscription = subject.subscribe(ArithmeticAdded, addedSubscriber)
        subject.subscribe(ArithmeticSubtracted, subtractedSubscriber)
        addedSubscription.unsubscribe()
        subject.send(ArithmeticAdded, 5)
        subject.send(ArithmeticSubtracted, 3)
        expect(addedSubscriber).not.toHaveBeenCalled()
        expect(subtractedSubscriber).toHaveBeenCalledWith(3)
    })

    it("should send invalidated broadcast when invalidated", () => {
        const subject = new RPCBroadcaster()
        subject._connection_onsend = subject._connection_receive
        const subscriber = vi.fn()
        subject.subscribe(RPCBroadcaster.invalidated, subscriber)
        subject.invalidate()
        expect(subscriber).toHaveBeenCalled()
    })

    it("should not be possible to use send before _connection_onsend is set", () => {
        const subject = new RPCBroadcaster()
        expect(() => subject.send(ArithmeticAdded, 5)).toThrow()
    })

    it("should reject all operations after invalidation", () => {
        const subject = new RPCBroadcaster()
        subject._connection_onsend = subject._connection_receive
        subject.invalidate()
        expect(subject.isValid).toBe(false)
        expect(() => subject.send(ArithmeticAdded, 5)).toThrow()
        expect(() => subject.subscribe(ArithmeticAdded, vi.fn())).toThrow()
        expect(() =>
            subject._connection_receive(ArithmeticAdded.channel, ArithmeticAdded.what, 42),
        ).toThrow()
    })
})
