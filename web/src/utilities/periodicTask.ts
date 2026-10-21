/** How many milliseconds are in a minute */
export const MS_PER_MINUTE = 60_000

/** How many milliseconds are in an hour */
export const MS_PER_HOUR = MS_PER_MINUTE * 60

export interface PeriodicTaskOptions {
    /** How often the task should run in milliseconds */
    readonly interval: number

    /** Key under which to store the last run date for the task */
    readonly key: string

    /** Where to store the last run date for the task, defaults to `localStorage` */
    readonly storage?: Storage
}

/**
 * A function that stops a periodic task from running later.
 */
export type PeriodicTaskCancel = () => void

export function getPeriodicTaskLastFireDate(
    key: string,
    storage: Storage = localStorage,
): Date | null {
    const prev = storage.getItem(key)
    if (prev === null) {
        return null
    }
    const lastFireDate = new Date(prev)
    if (Number.isNaN(lastFireDate.getTime())) {
        console.error(`*** Could not get last fire date for periodic task ${key}`, prev)
        return null
    }
    return lastFireDate
}

/**
 * Schedule a task to run periodically.
 *
 * The last run is remembered in `storage`, so the schedule carries over between page loads and
 * tabs. A task which has never run, or which is overdue, runs as soon as possible.
 *
 * @param task The task to run.
 * @param options The configuration of the task.
 * @returns A function which stops the task from running again if called.
 */
export function periodicTask(
    task: () => void,
    { interval, key, storage = globalThis.localStorage }: PeriodicTaskOptions,
): PeriodicTaskCancel {
    const setLastFireDate = (next: Date) => {
        storage.setItem(key, next.toISOString())
    }
    const getTimeUntilDue = () => {
        const lastFireDate = getPeriodicTaskLastFireDate(key, storage)
        if (lastFireDate === null) {
            return 0
        }
        const elapsed = Date.now() - lastFireDate.getTime()
        if (elapsed < 0) {
            // The clock went backwards since the last run, so start the interval over from now
            // rather than waiting for the clock to catch up
            setLastFireDate(new Date())
            return interval
        }
        return Math.max(0, interval - elapsed)
    }

    let isCancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
        clearTimeout(timeoutId)
        if (!isCancelled) {
            timeoutId = setTimeout(tick, getTimeUntilDue())
        }
    }
    const fire = () => {
        try {
            task()
        } catch (error) {
            console.error(`*** Unhandled error in ${key} periodic task`, error)
        }
        setLastFireDate(new Date())
        schedule()
    }
    // The last fire date is re-read each time, as another tab sharing the storage may have run
    // the task since this one was scheduled
    const tick = () => {
        if (getTimeUntilDue() === 0) {
            fire()
        } else {
            schedule()
        }
    }

    // Timers are throttled in background tabs, so catch up as soon as the page is visible again
    const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
            tick()
        }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    schedule()
    return () => {
        isCancelled = true
        clearTimeout(timeoutId)
        document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
}
