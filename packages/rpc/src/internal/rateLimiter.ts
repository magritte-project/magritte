export interface RateLimitOptions {
    /** How many times the operation may happen before its rate limited */
    readonly limit: number

    /** The duration in milliseconds before the limit resets */
    readonly samplePeriod: number
}

export class RateLimiter {
    /** How many times the operation may happen before its rate limited */
    private readonly _limit: number

    /** The duration in milliseconds before the limit resets */
    private readonly _samplePeriod: number

    /** The end of the current sample period */
    private _currentSamplePeriodEnd: number | null

    /** The number of operations which have happened in the current sample period */
    private _operationCount: number

    /**
     * Construct a rate limiter.
     *
     * @param options Options specifying how the rate limiter should behave.
     */
    constructor(options: RateLimitOptions) {
        if (options.limit <= 0 || !Number.isInteger(options.limit)) {
            throw new RangeError("Invalid limit")
        }
        if (options.samplePeriod < 1000 || !Number.isInteger(options.samplePeriod)) {
            throw new RangeError("Invalid sample period")
        }
        this._limit = options.limit
        this._samplePeriod = options.samplePeriod
        this._currentSamplePeriodEnd = null
        this._operationCount = 0
    }

    tryEnter(): boolean {
        const now = Date.now()
        if (this._currentSamplePeriodEnd === null || now > this._currentSamplePeriodEnd) {
            this._currentSamplePeriodEnd = now + this._samplePeriod
            this._operationCount = 0
        }
        if (this._operationCount >= this._limit) {
            return false
        }
        this._operationCount++
        return true
    }
}

/** Error which indicates a connection's rate limit has been exceeded */
export class RateLimitExceededError extends Error {
    constructor(message: string = "Rate limit exceeded") {
        super(message)
        this.name = "RateLimitExceededError"
    }
}
