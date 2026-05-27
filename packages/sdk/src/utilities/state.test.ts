import { describe, expect, it, vi } from "vitest"

import { $oneWayMap, $state, $twoWayMap, PropertySubscribers } from "./state"

describe("state", () => {
    describe("#PropertySubscribers", () => {
        it("should correctly manage subscriptions", () => {
            const subject = new PropertySubscribers<number>()
            const firstSubscriber = vi.fn()
            const firstSubscription = subject.subscribe(firstSubscriber)
            const secondSubscriber = vi.fn()
            subject.subscribe(secondSubscriber)

            firstSubscription.unsubscribe()
            subject.notify(42)

            expect(firstSubscriber).not.toHaveBeenCalled()
            expect(secondSubscriber).toHaveBeenCalledWith(42)
        })

        it("should notify all subscribers", () => {
            const subject = new PropertySubscribers<number>()
            const firstSubscriber = vi.fn()
            const secondSubscriber = vi.fn()
            subject.subscribe(firstSubscriber)
            subject.subscribe(secondSubscriber)

            subject.notify(42)

            expect(firstSubscriber).toHaveBeenCalledWith(42)
            expect(secondSubscriber).toHaveBeenCalledWith(42)
        })

        it("should not allow errors to propagate out", () => {
            const subject = new PropertySubscribers<number>()
            const firstSubscriber = vi.fn(() => {
                throw new Error("test")
            })
            subject.subscribe(firstSubscriber)
            const secondSubscriber = vi.fn()
            subject.subscribe(secondSubscriber)

            expect(() => subject.notify(42)).not.toThrow()

            expect(firstSubscriber).toHaveBeenCalledWith(42)
            expect(secondSubscriber).toHaveBeenCalledWith(42)
        })
    })

    describe("$state", () => {
        it("should allow setting the wrapped value", () => {
            const subject = $state(0)
            subject.wrappedValue = 42

            expect(subject.wrappedValue).toBe(42)
        })

        it("should notify subscribers of state changes", () => {
            const subject = $state(0)
            const subscriber = vi.fn()
            subject.subscribe(subscriber)
            subject.wrappedValue = 42

            expect(subscriber).toHaveBeenCalledWith(42)
        })
    })

    describe("$twoWayMap", () => {
        it("should allow getting and setting the wrapped value", () => {
            const subject = $twoWayMap(
                $state(0),
                (value) => String(value),
                (newValue) => Number(newValue),
            )
            expect(subject.wrappedValue).toBe("0")

            subject.wrappedValue = "42"
            expect(subject.wrappedValue).toBe("42")
        })

        it("should notify subscribers of state changes", () => {
            const subject = $twoWayMap(
                $state(0),
                (value) => String(value),
                (newValue) => Number(newValue),
            )
            const subscriber = vi.fn()
            subject.subscribe(subscriber)
            subject.wrappedValue = "42"

            expect(subscriber).toHaveBeenCalledWith("42")
        })
    })

    describe("$oneWayMap", () => {
        it("should project the source value", () => {
            const subject = $oneWayMap($state(0), (value) => String(value))
            expect(subject.wrappedValue).toBe("0")
        })

        it("should notify subscribers of state changes", () => {
            const underlying = $state(0)
            const subject = $oneWayMap(underlying, (value) => String(value))
            const subscriber = vi.fn()
            subject.subscribe(subscriber)
            underlying.wrappedValue = 42

            expect(subscriber).toHaveBeenCalledWith("42")
        })
    })
})
