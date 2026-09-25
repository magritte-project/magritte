import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { RateLimiter } from "@/musicbrainz/rateLimiter"

describe("RateLimiter", () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(0)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    function makeLimiter() {
        return new RateLimiter({ intervalMs: 1000 })
    }

    it("starts the first task right away", async () => {
        const limiter = makeLimiter()
        const task = vi.fn(async () => "result")
        const promise = limiter.schedule(task)
        await vi.advanceTimersByTimeAsync(0)
        expect(task).toHaveBeenCalledTimes(1)
        expect(await promise).toBe("result")
    })

    it("spaces out a burst by the interval", async () => {
        const limiter = makeLimiter()
        const startTimes: number[] = []
        const task = async () => {
            startTimes.push(Date.now())
        }
        void limiter.schedule(task)
        void limiter.schedule(task)
        void limiter.schedule(task)

        await vi.advanceTimersByTimeAsync(0)
        expect(startTimes).toEqual([0])
        await vi.advanceTimersByTimeAsync(1000)
        expect(startTimes).toEqual([0, 1000])
        await vi.advanceTimersByTimeAsync(1000)
        expect(startTimes).toEqual([0, 1000, 2000])
    })

    it("measures from start times, so a slow task does not delay the next", async () => {
        const limiter = makeLimiter()
        const startTimes: number[] = []
        void limiter.schedule(async () => {
            startTimes.push(Date.now())
            await new Promise((resolve) => setTimeout(resolve, 5000))
        })
        void limiter.schedule(async () => {
            startTimes.push(Date.now())
        })

        await vi.advanceTimersByTimeAsync(1000)
        expect(startTimes).toEqual([0, 1000])
    })

    it("does not let a failure block later tasks", async () => {
        const limiter = makeLimiter()
        const failed = limiter.schedule(async () => {
            throw new Error("boom")
        })
        const started = vi.fn(async () => {})
        void limiter.schedule(started)

        await expect(failed).rejects.toThrow("boom")
        await vi.advanceTimersByTimeAsync(1000)
        expect(started).toHaveBeenCalledTimes(1)
    })

    it("starts immediately again after a quiet spell", async () => {
        const limiter = makeLimiter()
        const startTimes: number[] = []
        const task = async () => {
            startTimes.push(Date.now())
        }
        void limiter.schedule(task)
        await vi.advanceTimersByTimeAsync(5000)
        void limiter.schedule(task)
        await vi.advanceTimersByTimeAsync(0)
        expect(startTimes).toEqual([0, 5000])
    })
})
