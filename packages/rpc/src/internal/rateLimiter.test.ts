import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { RateLimiter } from "./rateLimiter"

const LIMIT = 5
const SAMPLE_PERIOD = 1_000

function makeLimiter(options: { limit?: number; samplePeriod?: number } = {}): RateLimiter {
    return new RateLimiter({
        limit: options.limit ?? LIMIT,
        samplePeriod: options.samplePeriod ?? SAMPLE_PERIOD,
    })
}

/**
 * Calls `tryEnter` until it is refused, returning the number of calls that were allowed.
 * This keeps tests about window behavior independent of the exact per-window budget.
 */
function exhaust(limiter: RateLimiter): number {
    for (let allowed = 0; allowed < 1_000; allowed++) {
        if (!limiter.tryEnter()) {
            return allowed
        }
    }
    throw new Error("Rate limiter never refused entry")
}

describe("RateLimiter", () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ["Date"], now: 0 })
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe("constructor", () => {
        it.each([0, -1, -100, 2.5, NaN, Infinity, -Infinity])(
            "should reject a limit of %d",
            (limit) => {
                expect(() => makeLimiter({ limit })).toThrow(new RangeError("Invalid limit"))
            },
        )

        it("should accept a limit of one", () => {
            const limiter = makeLimiter({ limit: 1 })
            expect(limiter.tryEnter()).toBe(true)
            expect(limiter.tryEnter()).toBe(false)
        })

        it.each([999, 0, -1000, 1000.5, NaN, Infinity])(
            "should reject a sample period of %d",
            (samplePeriod) => {
                expect(() => makeLimiter({ samplePeriod })).toThrow(
                    new RangeError("Invalid sample period"),
                )
            },
        )

        it("should accept a sample period of one second", () => {
            expect(() => makeLimiter({ samplePeriod: 1000 })).not.toThrow()
        })
    })

    describe("#tryEnter", () => {
        it("should allow calls up to the limit within a sample period", () => {
            const limiter = makeLimiter()
            for (let i = 0; i < LIMIT; i++) {
                expect(limiter.tryEnter()).toBe(true)
            }
        })

        it("should refuse once the limit is reached within a sample period", () => {
            const limiter = makeLimiter()
            for (let i = 0; i < LIMIT; i++) {
                limiter.tryEnter()
            }
            expect(limiter.tryEnter()).toBe(false)
        })

        it("should allow exactly `limit` calls per sample period", () => {
            const limiter = makeLimiter()
            expect(exhaust(limiter)).toBe(LIMIT)
            vi.advanceTimersByTime(SAMPLE_PERIOD + 1)
            expect(exhaust(limiter)).toBe(LIMIT)
        })

        it("should keep refusing for the rest of the sample period", () => {
            const limiter = makeLimiter()
            exhaust(limiter)
            for (const elapsed of [1, SAMPLE_PERIOD / 2, SAMPLE_PERIOD - 1]) {
                vi.setSystemTime(elapsed)
                expect(limiter.tryEnter()).toBe(false)
            }
        })

        it("should still refuse at exactly the end of the sample period", () => {
            const limiter = makeLimiter()
            exhaust(limiter)
            vi.setSystemTime(SAMPLE_PERIOD)
            expect(limiter.tryEnter()).toBe(false)
        })

        it("should allow calls again once the sample period has elapsed", () => {
            const limiter = makeLimiter()
            exhaust(limiter)
            vi.setSystemTime(SAMPLE_PERIOD + 1)
            expect(limiter.tryEnter()).toBe(true)
        })

        it("should allow the same number of calls in every sample period", () => {
            const limiter = makeLimiter()
            const firstPeriod = exhaust(limiter)
            for (let period = 1; period <= 3; period++) {
                vi.advanceTimersByTime(SAMPLE_PERIOD + 1)
                expect(exhaust(limiter)).toBe(firstPeriod)
            }
        })

        it("should not count refused calls against the next sample period", () => {
            const limiter = makeLimiter()
            const budget = exhaust(limiter)
            for (let i = 0; i < 10; i++) {
                expect(limiter.tryEnter()).toBe(false)
            }
            vi.setSystemTime(SAMPLE_PERIOD + 1)
            expect(exhaust(limiter)).toBe(budget)
        })

        it("should allow calls spread out across many sample periods", () => {
            const limiter = makeLimiter({ limit: 1 })
            for (let i = 0; i < 10; i++) {
                expect(limiter.tryEnter()).toBe(true)
                vi.advanceTimersByTime(SAMPLE_PERIOD + 1)
            }
        })

        it("should start the sample period at the first call, not at construction", () => {
            const limiter = makeLimiter()
            vi.setSystemTime(10 * SAMPLE_PERIOD)
            exhaust(limiter)
            vi.setSystemTime(10 * SAMPLE_PERIOD + SAMPLE_PERIOD / 2)
            expect(limiter.tryEnter()).toBe(false)
        })

        it("should start a new sample period at the first call after the previous one ends", () => {
            const limiter = makeLimiter()
            exhaust(limiter)
            // The first period ends at SAMPLE_PERIOD; start the next one well after that.
            const secondStart = SAMPLE_PERIOD * 1.5
            vi.setSystemTime(secondStart)
            exhaust(limiter)
            // Past where a period aligned to the first one would end, but still
            // inside a period which began at `secondStart`.
            vi.setSystemTime(secondStart + SAMPLE_PERIOD - 1)
            expect(limiter.tryEnter()).toBe(false)
        })

        it("should track limits independently for each instance", () => {
            const first = makeLimiter()
            const second = makeLimiter()
            exhaust(first)
            expect(second.tryEnter()).toBe(true)
            expect(first.tryEnter()).toBe(false)
        })
    })
})
