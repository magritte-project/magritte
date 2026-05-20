/**
 * A value which can be changed for the duration of a function call.
 */
export class Local<T> {
    /** Storage for the current value of the local */
    private _currentValue: T

    /**
     * Construct a local with an initial value.
     *
     * @param initialValue The initial value.
     */
    constructor(initialValue: T) {
        this._currentValue = initialValue
    }

    /** The current value */
    get value(): T {
        return this._currentValue
    }

    /**
     * Set this local to a specified value for the duration of an operation.
     *
     * @param newValue The new value to set.
     * @param operation The operation.
     * @returns The result of the operation.
     */
    withValue<R>(newValue: T, operation: (value: T) => R): R {
        const oldValue = this._currentValue
        try {
            this._currentValue = newValue
            return operation(this._currentValue)
        } finally {
            this._currentValue = oldValue
        }
    }

    /**
     * Set this local to a specified value for the duration of an async operation.
     *
     * @param newValue The new value to set.
     * @param operation The async operation.
     * @returns The result of the async operation.
     */
    async withValueAsync<R>(newValue: T, operation: (value: T) => Promise<R>): Promise<R> {
        const oldValue = this._currentValue
        try {
            this._currentValue = newValue
            return await operation(this._currentValue)
        } finally {
            this._currentValue = oldValue
        }
    }
}
