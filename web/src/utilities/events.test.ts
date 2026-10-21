import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import { createEvent, justEventsMatching, combineUnsubscribers } from "./events"

const mockConsoleError = vi.fn()

describe("events", () => {
    beforeAll(() => {
        vi.resetAllMocks()
        vi.stubGlobal("console", { ...console, error: mockConsoleError })
    })

    afterAll(() => {
        vi.unstubAllGlobals()
    })

    describe("#createEvent", () => {
        it("should notify active subscribers", async () => {
            const [_dispatch, subscribe] = createEvent<number>()
            const firstSubscriber = vi.fn().mockResolvedValue(undefined)
            const unsubscribeFirst = subscribe(firstSubscriber)
            const secondSubscriber = vi.fn().mockResolvedValue(undefined)
            subscribe(secondSubscriber)
            unsubscribeFirst()
            await _dispatch(42)

            expect(vi.mocked(firstSubscriber)).not.toHaveBeenCalled()
            expect(vi.mocked(secondSubscriber)).toHaveBeenCalled()
        })

        it("should not allow errors to propagate", async () => {
            const [_dispatch, subscribe] = createEvent<number>()
            const subscriber = vi.fn().mockRejectedValue(new Error("test"))
            subscribe(subscriber)
            await expect(_dispatch(42)).resolves.not.toThrow()
            expect(vi.mocked(subscriber)).toHaveBeenCalled()
            expect(mockConsoleError).toHaveBeenCalled()
        })

        it("should not block without await subscribers", async () => {
            const [_dispatch, subscribe] = createEvent<number>({ awaitSubscribers: false })
            const subscriber = vi.fn().mockResolvedValue(undefined)
            subscribe(
                (_event) =>
                    new Promise(() => {
                        /* never complete */
                    }),
            )
            subscribe(subscriber)
            await _dispatch(42)
            expect(vi.mocked(subscriber)).toHaveBeenCalled()
        })
    })

    describe("#justEventsMatching", () => {
        it("should only forward events of the specified type", async () => {
            const [_dispatch, subscribe] = createEvent<
                { type: "added"; result: number } | { type: "subtracted"; result: number }
            >()
            const subscriber = vi.fn().mockResolvedValue(undefined)
            subscribe(justEventsMatching("type", "added", subscriber))

            await _dispatch({ type: "added", result: 42 })
            expect(vi.mocked(subscriber)).toHaveBeenCalledWith({ type: "added", result: 42 })

            await _dispatch({ type: "subtracted", result: 1984 })
            expect(vi.mocked(subscriber)).not.toHaveBeenCalledWith({
                type: "subtracted",
                result: 1984,
            })
        })
    })

    describe("#combineUnsubscribers", () => {
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
