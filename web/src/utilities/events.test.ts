import { describe, expect, it, vi } from "vitest"

import { createEvent, justEventsMatching, combineUnsubscribers } from "./events"

describe("events", () => {
    describe("#createEvent", () => {
        it("should notify active subscribers", async () => {
            const [_dispatch, subscribe] = createEvent<number>()
            const firstCallback = vi.fn().mockResolvedValue(undefined)
            const unsubscribeFirst = subscribe(firstCallback)
            const secondCallback = vi.fn().mockResolvedValue(undefined)
            subscribe(secondCallback)
            unsubscribeFirst()
            await _dispatch(42)

            expect(vi.mocked(firstCallback)).not.toHaveBeenCalled()
            expect(vi.mocked(secondCallback)).toHaveBeenCalled()
        })

        it("should not allow errors to propagate", async () => {
            const [_dispatch, subscribe] = createEvent<number>()
            const callback = vi.fn().mockRejectedValue(new Error("test"))
            subscribe(callback)
            expect(_dispatch(42)).resolves.not.toThrow()
            expect(vi.mocked(callback)).toHaveBeenCalled()
        })

        it("should not block without await callbacks", async () => {
            const [_dispatch, subscribe] = createEvent<number>({ awaitsCallbacks: false })
            const callback = vi.fn().mockResolvedValue(undefined)
            subscribe(
                (_event) =>
                    new Promise(() => {
                        /* never complete */
                    }),
            )
            subscribe(callback)
            await _dispatch(42)
            expect(vi.mocked(callback)).toHaveBeenCalled()
        })
    })

    describe("#filterTo", () => {
        it("should only forward events of the specified type", async () => {
            const [_dispatch, subscribe] = createEvent<
                { type: "added"; result: number } | { type: "subtracted"; result: number }
            >()
            const callback = vi.fn().mockResolvedValue(undefined)
            subscribe(justEventsMatching("type", "added", callback))

            await _dispatch({ type: "added", result: 42 })
            expect(vi.mocked(callback)).toHaveBeenCalledWith({ type: "added", result: 42 })

            await _dispatch({ type: "subtracted", result: 1984 })
            expect(vi.mocked(callback)).not.toHaveBeenCalledWith({
                type: "subtracted",
                result: 1984,
            })
        })
    })

    describe("#unsubscribeAll", () => {
        it("should unsubscribe all active subscribers", () => {
            const first = vi.fn()
            const second = vi.fn()
            const third = vi.fn()
            const unsubscribe = combineUnsubscribers(first, second, third)
            unsubscribe()
            expect(first).toHaveBeenCalled()
            expect(second).toHaveBeenCalled()
            expect(third).toHaveBeenCalled()
        })
    })
})
