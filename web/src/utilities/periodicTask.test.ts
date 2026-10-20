import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getPeriodicTaskLastFireDate, periodicTask } from "./periodicTask"

const KEY = "test.periodicTask"
const INTERVAL = 1000

/** Record that the task last ran the given number of milliseconds ago */
function lastRanAgo(milliseconds: number, storage: Storage = localStorage) {
    storage.setItem(KEY, new Date(Date.now() - milliseconds).toISOString())
}

function setVisibility(state: DocumentVisibilityState) {
    vi.spyOn(document, "visibilityState", "get").mockReturnValue(state)
    document.dispatchEvent(new Event("visibilitychange"))
}

describe("periodicTask", () => {
    const cancels: (() => void)[] = []

    /** Start a periodic task, which is cancelled after the test even if the test fails */
    function start(task: () => void, storage?: Storage) {
        const cancel = periodicTask(task, { interval: INTERVAL, key: KEY, storage })
        cancels.push(cancel)
        return cancel
    }

    beforeEach(() => {
        vi.useFakeTimers()
        localStorage.clear()
        sessionStorage.clear()
    })

    afterEach(() => {
        for (const cancel of cancels.splice(0)) {
            cancel()
        }
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    describe("when starting", () => {
        it("should run a task which has never run", () => {
            const task = vi.fn()
            start(task)
            // Not synchronously, so the caller has the cancel function first
            expect(task).not.toHaveBeenCalled()

            vi.advanceTimersByTime(0)
            expect(task).toHaveBeenCalledTimes(1)
        })

        it("should run a task which is overdue", () => {
            lastRanAgo(INTERVAL * 5)
            const task = vi.fn()
            start(task)

            vi.advanceTimersByTime(0)
            expect(task).toHaveBeenCalledTimes(1)
        })

        it("should wait out the rest of the interval since the last run", () => {
            lastRanAgo(INTERVAL - 300)
            const task = vi.fn()
            start(task)

            vi.advanceTimersByTime(299)
            expect(task).not.toHaveBeenCalled()

            vi.advanceTimersByTime(1)
            expect(task).toHaveBeenCalledTimes(1)
        })

        it("should run a task whose last run date is unreadable, and report it", () => {
            const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
            localStorage.setItem(KEY, "not a date")
            const task = vi.fn()
            start(task)

            vi.advanceTimersByTime(0)
            expect(task).toHaveBeenCalledTimes(1)
            expect(consoleError).toHaveBeenCalledWith(expect.stringContaining(KEY), "not a date")
        })

        it("should wait one interval if the last run is in the future", () => {
            // As if the clock went backwards since the last run
            lastRanAgo(-INTERVAL * 5)
            const task = vi.fn()
            start(task)

            vi.advanceTimersByTime(INTERVAL - 1)
            expect(task).not.toHaveBeenCalled()

            vi.advanceTimersByTime(1)
            expect(task).toHaveBeenCalledTimes(1)
        })
    })

    it("should run the task once per interval", () => {
        lastRanAgo(0)
        const task = vi.fn()
        start(task)

        vi.advanceTimersByTime(INTERVAL - 1)
        expect(task).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1)
        expect(task).toHaveBeenCalledTimes(1)

        vi.advanceTimersByTime(INTERVAL * 2)
        expect(task).toHaveBeenCalledTimes(3)
    })

    it("should record when the task last ran", () => {
        vi.setSystemTime(new Date("2026-01-01T00:00:00Z"))
        start(vi.fn())
        expect(localStorage.getItem(KEY)).toBeNull()

        vi.advanceTimersByTime(0)
        expect(localStorage.getItem(KEY)).toBe("2026-01-01T00:00:00.000Z")

        vi.advanceTimersByTime(INTERVAL)
        expect(localStorage.getItem(KEY)).toBe("2026-01-01T00:00:01.000Z")
    })

    it("should use the given storage", () => {
        lastRanAgo(0, sessionStorage)
        const task = vi.fn()
        start(task, sessionStorage)

        // The last run in `sessionStorage` means the task is not due yet
        vi.advanceTimersByTime(0)
        expect(task).not.toHaveBeenCalled()

        vi.advanceTimersByTime(INTERVAL)
        expect(task).toHaveBeenCalledTimes(1)
        expect(localStorage.getItem(KEY)).toBeNull()
    })

    it("should postpone the task if another tab ran it", () => {
        lastRanAgo(0)
        const task = vi.fn()
        start(task)

        vi.advanceTimersByTime(INTERVAL / 2)
        lastRanAgo(0)
        vi.advanceTimersByTime(INTERVAL / 2)
        expect(task).not.toHaveBeenCalled()

        vi.advanceTimersByTime(INTERVAL / 2)
        expect(task).toHaveBeenCalledTimes(1)
    })

    it("should keep running after the task throws", () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
        const error = new Error("Something went wrong")
        const task = vi.fn(() => {
            throw error
        })
        start(task)

        vi.advanceTimersByTime(INTERVAL)
        expect(task).toHaveBeenCalledTimes(2)
        expect(consoleError).toHaveBeenCalledWith(expect.stringContaining(KEY), error)
        // A failed run still counts as a run
        expect(localStorage.getItem(KEY)).not.toBeNull()
    })

    describe("when cancelled", () => {
        it("should stop running", () => {
            const task = vi.fn()
            const cancel = start(task)

            vi.advanceTimersByTime(0)
            cancel()
            vi.advanceTimersByTime(INTERVAL * 5)
            expect(task).toHaveBeenCalledTimes(1)

            // Overdue, but no longer listening for the page becoming visible
            setVisibility("visible")
            expect(task).toHaveBeenCalledTimes(1)
        })

        it("should stop running when cancelled by the task itself", () => {
            const task = vi.fn(() => {
                cancel()
            })
            const cancel = start(task)

            vi.advanceTimersByTime(INTERVAL * 5)
            expect(task).toHaveBeenCalledTimes(1)
        })
    })

    describe("when the page becomes visible", () => {
        it("should run the task immediately if it is overdue", () => {
            lastRanAgo(0)
            const task = vi.fn()
            start(task)

            // As if the timer was throttled while the page was hidden
            lastRanAgo(INTERVAL)
            setVisibility("visible")
            expect(task).toHaveBeenCalledTimes(1)
            expect(localStorage.getItem(KEY)).toBe(new Date().toISOString())
        })

        it("should restart the interval after running the task", () => {
            lastRanAgo(INTERVAL / 2)
            const task = vi.fn()
            start(task)

            lastRanAgo(INTERVAL)
            setVisibility("visible")
            expect(task).toHaveBeenCalledTimes(1)

            // The original timer would have fired here
            vi.advanceTimersByTime(INTERVAL / 2)
            expect(task).toHaveBeenCalledTimes(1)

            vi.advanceTimersByTime(INTERVAL / 2)
            expect(task).toHaveBeenCalledTimes(2)
        })

        it("should not run the task if it ran recently", () => {
            lastRanAgo(INTERVAL - 1)
            const task = vi.fn()
            start(task)

            setVisibility("visible")
            expect(task).not.toHaveBeenCalled()
        })

        it("should not run the task when the page is hidden", () => {
            lastRanAgo(0)
            const task = vi.fn()
            start(task)

            lastRanAgo(INTERVAL * 5)
            setVisibility("hidden")
            expect(task).not.toHaveBeenCalled()
        })
    })
})

describe("getPeriodicTaskLastFireDate", () => {
    beforeEach(() => {
        localStorage.clear()
        sessionStorage.clear()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("should return null for a task which has never run", () => {
        expect(getPeriodicTaskLastFireDate(KEY)).toBeNull()
    })

    it("should return when the task last ran", () => {
        localStorage.setItem(KEY, "2026-01-01T00:00:00.000Z")
        expect(getPeriodicTaskLastFireDate(KEY)).toStrictEqual(new Date("2026-01-01T00:00:00Z"))
    })

    it("should read from the given storage", () => {
        sessionStorage.setItem(KEY, "2026-01-01T00:00:00.000Z")
        expect(getPeriodicTaskLastFireDate(KEY, sessionStorage)).toStrictEqual(
            new Date("2026-01-01T00:00:00Z"),
        )
        expect(getPeriodicTaskLastFireDate(KEY)).toBeNull()
    })

    it("should return null and report an unreadable date", () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
        localStorage.setItem(KEY, "not a date")
        expect(getPeriodicTaskLastFireDate(KEY)).toBeNull()
        expect(consoleError).toHaveBeenCalledWith(expect.stringContaining(KEY), "not a date")
    })

    it("should reflect runs of the periodic task", () => {
        vi.useFakeTimers({ now: new Date("2026-01-01T00:00:00Z") })
        const cancel = periodicTask(vi.fn(), { interval: INTERVAL, key: KEY })
        try {
            vi.advanceTimersByTime(0)
            expect(getPeriodicTaskLastFireDate(KEY)).toStrictEqual(new Date("2026-01-01T00:00:00Z"))

            vi.advanceTimersByTime(INTERVAL)
            expect(getPeriodicTaskLastFireDate(KEY)).toStrictEqual(new Date("2026-01-01T00:00:01Z"))
        } finally {
            cancel()
            vi.useRealTimers()
        }
    })
})
