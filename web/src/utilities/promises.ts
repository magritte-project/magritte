export interface PromiseResolver<T> {
    promise: Promise<T>
    resolve: (value: T) => void
    reject: (reason?: unknown) => void
}

export function promiseResolver<T>(): PromiseResolver<T> {
    let resolve: (value: T) => void
    let reject: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve: resolve!, reject: reject! }
}

/**
 * Suspend execution until the specified time has elapsed.
 *
 * @param delay A non-negative integer indicating how long the timer should
 * wait before the specified function or code is executed, in milliseconds.
 * @param signal Optional abort signal to interrupt the timeout early
 */
export function timeout(delay: number, signal?: AbortSignal): Promise<void> {
    const { promise, resolve, reject } = promiseResolver<void>()
    const handleAbort = () => {
        reject(new Error("Timeout aborted"))
    }
    if (signal?.aborted) {
        handleAbort()
        return promise
    }
    signal?.addEventListener("abort", handleAbort, { once: true })
    setTimeout(() => {
        if (!signal?.aborted) {
            signal?.removeEventListener("abort", handleAbort)
            resolve()
        }
    }, delay)
    return promise
}

/**
 * Options for a `poll` operation.
 */
export interface PollOptions<T> {
    /** A test which the value must pass */
    readonly test: (next: T) => boolean

    /** How long to wait between attempts */
    readonly waitTime?: number

    /** How many times to poll for a value before giving up */
    readonly attempts?: number

    /** Optional abort signal to interrupt the polling early */
    readonly signal?: AbortSignal
}

/**
 * Poll a given value until it passes a test.
 *
 * @param get A value which must pass a test.
 * @param options The configuration of the poll operation.
 * @returns The value which passed the test.
 * @throws An `Error` if the value never passes the test
 * before running out of `attempts`.
 */
export async function poll<T>(
    get: () => T,
    { test, waitTime = 16, attempts = 5, signal }: PollOptions<T>,
): Promise<T> {
    for (let i = 0; i < attempts; i++) {
        signal?.throwIfAborted()
        const next = get()
        if (test(next)) {
            return next
        }
        await timeout(waitTime, signal)
    }
    throw new Error("Value failed test")
}
