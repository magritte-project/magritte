/** The internal state of a deferred value. */
type DeferredState<T> =
    | { status: "pending" }
    | { status: "resolved"; value: T }
    | { status: "rejected"; reason: unknown }

/** The status of a deferred value. */
export type DeferredStatus = DeferredState<unknown>["status"]

/**
 * A deferred value which will become available at a later time.
 */
export interface Deferred<T> {
    /** The current status of the value */
    readonly status: DeferredStatus

    /**
     * Get the deferred value
     *
     * @throws A `PendingDeferredError` If the value has not yet resolved,
     * or a generic `Error` if the value was rejected.
     * @returns The deferred value.
     */
    get(): T
}

export interface DeferredResolvers<T> {
    /** The deferred value */
    deferred: Deferred<T>

    /**
     * Resolve the deferred value.
     *
     * @param value The resolved value.
     */
    resolve: (value: T) => void

    /**
     * Reject the deferred value.
     *
     * @param reason The reason for rejection.
     */
    reject: (reason: unknown) => void
}

/** Error which indicates that a deferred value is still pending */
export class PendingDeferredError extends Error {
    constructor(message: string = "Deferred value is still pending") {
        super(message)
    }
}

/**
 * Create a pending deferred value.
 *
 * @returns A deferred value with connected `resolve` and `reject` functions.
 */
export function createDeferred<T>(): DeferredResolvers<T> {
    let state: DeferredState<T> = { status: "pending" }
    const deferred: Deferred<T> = {
        get status(): DeferredStatus {
            return state.status
        },
        get(): T {
            switch (state.status) {
                case "pending":
                    throw new PendingDeferredError()
                case "resolved":
                    return state.value
                case "rejected":
                    throw state.reason
            }
        },
    }
    const resolve = (value: T) => {
        state = { status: "resolved", value }
    }
    const reject = (reason: unknown) => {
        state = { status: "rejected", reason }
    }
    return { deferred, resolve, reject }
}
