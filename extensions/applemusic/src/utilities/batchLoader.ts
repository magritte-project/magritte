interface PendingLoad<Value> {
    readonly resolve: (value: Value) => void
    readonly reject: (error: unknown) => void
}

/**
 * Coalesces keys loaded during the same tick into batched requests,
 * so that many list rows can share a handful of network requests.
 */
export class BatchLoader<Key, Value> {
    private _pending = new Map<Key, PendingLoad<Value>[]>()
    private _isScheduled = false

    constructor(
        private readonly batchFn: (keys: readonly Key[]) => Promise<ReadonlyMap<Key, Value>>,
        private readonly maxBatchSize: number,
    ) {}

    load(key: Key): Promise<Value> {
        return new Promise((resolve, reject) => {
            const loads = this._pending.get(key) ?? []
            loads.push({ resolve, reject })
            this._pending.set(key, loads)
            if (!this._isScheduled) {
                this._isScheduled = true
                setTimeout(() => this._dispatch(), 0)
            }
        })
    }

    private _dispatch() {
        const pending = this._pending
        this._pending = new Map()
        this._isScheduled = false

        const keys = [...pending.keys()]
        for (let start = 0; start < keys.length; start += this.maxBatchSize) {
            const batch = keys.slice(start, start + this.maxBatchSize)
            this.batchFn(batch).then(
                (values) => {
                    for (const key of batch) {
                        for (const { resolve, reject } of pending.get(key) ?? []) {
                            if (values.has(key)) {
                                resolve(values.get(key) as Value)
                            } else {
                                reject(new Error(`No value was loaded for ${String(key)}`))
                            }
                        }
                    }
                },
                (error) => {
                    for (const key of batch) {
                        for (const { reject } of pending.get(key) ?? []) {
                            reject(error)
                        }
                    }
                },
            )
        }
    }
}
