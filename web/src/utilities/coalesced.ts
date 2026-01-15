type CoalescedState<T> =
    | { type: "idle" }
    | { type: "pending"; result: Promise<T> }
    | { type: "resolved"; value: T }

export class Coalesced<T> {
    private readonly _work: () => Promise<T>
    private _state: CoalescedState<T>

    constructor(work: () => Promise<T>) {
        this._work = work
        this._state = { type: "idle" }
    }

    private _transitionTo(newState: CoalescedState<T>) {
        switch (newState.type) {
            case "idle":
                break
            case "pending":
                if (this._state.type !== "idle") {
                    throw new Error(`Cannot transition to pending from ${this._state.type}`)
                }
                break
            case "resolved":
                if (this._state.type !== "pending") {
                    throw new Error(`Cannot transition to resolved from ${this._state.type}`)
                }
                break
        }
        this._state = newState
    }

    private _fire() {
        const result = this._work()
        this._transitionTo({ type: "pending", result })
        result.then((value) => {
            this._transitionTo({ type: "resolved", value })
        })
        result.catch((error) => {
            this._transitionTo({ type: "idle" })
            throw error
        })
        return result
    }

    invalidate() {
        this._transitionTo({ type: "idle" })
    }

    get(): Promise<T> {
        switch (this._state.type) {
            case "idle": {
                return this._fire()
            }
            case "pending": {
                return this._state.result
            }
            case "resolved": {
                return Promise.resolve(this._state.value)
            }
        }
    }
}
