import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { poll, timeout } from "./promises"

describe("promises", () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe("#timeout", () => {
        it("should resolve at the end of the timeout", async () => {
            const onResolve = vi.fn()
            const promise = timeout(100).then(onResolve)

            await vi.advanceTimersByTimeAsync(99)
            expect(onResolve).not.toHaveBeenCalled()

            await vi.advanceTimersByTimeAsync(1)
            await promise
            expect(onResolve).toHaveBeenCalledOnce()
        })

        it("should reject if the signal is aborted", async () => {
            const controller = new AbortController()
            const promise = timeout(100, controller.signal)

            controller.abort()

            await expect(promise).rejects.toThrow("Timeout aborted")
        })

        it("should reject immediately if the signal is already aborted", async () => {
            const controller = new AbortController()
            controller.abort()

            await expect(timeout(100, controller.signal)).rejects.toThrow("Timeout aborted")
        })
    })

    describe("#poll", () => {
        it("should call getter until it passes test", async () => {
            const get = vi.fn().mockReturnValueOnce(1).mockReturnValueOnce(2).mockReturnValue(3)
            const promise = poll(get, { test: (value) => value === 3, waitTime: 10 })

            await vi.advanceTimersByTimeAsync(20)

            await expect(promise).resolves.toBe(3)
            expect(get).toHaveBeenCalledTimes(3)
        })

        it("should reject if the value never passes the test", async () => {
            const get = vi.fn().mockReturnValue(1)
            const promise = poll(get, { test: () => false, waitTime: 10, attempts: 3 })
            const assertion = expect(promise).rejects.toThrow("Value failed test")

            await vi.advanceTimersByTimeAsync(30)

            await assertion
            expect(get).toHaveBeenCalledTimes(3)
        })

        it("should reject if the signal is aborted", async () => {
            const controller = new AbortController()
            const get = vi.fn().mockReturnValue(1)
            const promise = poll(get, {
                test: () => false,
                waitTime: 10,
                signal: controller.signal,
            })
            const assertion = expect(promise).rejects.toThrow()

            await vi.advanceTimersByTimeAsync(15)
            controller.abort()

            await assertion
            expect(get).toHaveBeenCalledTimes(2)
        })
    })
})
