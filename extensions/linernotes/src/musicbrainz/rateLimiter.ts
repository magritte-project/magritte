export interface RateLimiterOptions {
    /** The minimum gap between the start of one task and the start of the next */
    readonly intervalMs: number
    /** Overridable so tests can control the clock */
    readonly now?: () => number
    readonly wait?: (ms: number) => Promise<void>
}

const defaultWait = (ms: number) =>
    new Promise<void>((resolve) => {
        setTimeout(resolve, ms)
    })

/**
 * Spaces out the start of tasks so that no more than one begins per interval.
 *
 * MusicBrainz allows one request per second per client, and answers with a 503
 * when that is exceeded. Spacing is measured between start times rather than
 * from the end of the previous task, so a slow response does not hold up the
 * queue and a burst after a quiet period still never exceeds the rate.
 */
export class RateLimiter {
    private readonly _intervalMs: number
    private readonly _now: () => number
    private readonly _wait: (ms: number) => Promise<void>
    private _nextStartAt = Number.NEGATIVE_INFINITY

    constructor({ intervalMs, now = Date.now, wait = defaultWait }: RateLimiterOptions) {
        this._intervalMs = intervalMs
        this._now = now
        this._wait = wait
    }

    /** Run a task once its turn comes, resolving or rejecting with its result */
    async schedule<T>(task: () => Promise<T>): Promise<T> {
        const now = this._now()
        const startAt = Math.max(now, this._nextStartAt)
        // Claimed before waiting, so tasks scheduled meanwhile queue up behind this one
        this._nextStartAt = startAt + this._intervalMs
        if (startAt > now) {
            await this._wait(startAt - now)
        }
        return await task()
    }
}
