import { createEvent, type EventDispatch, type EventSubscribe } from "@/utilities/events"

interface TaskDetails {
    readonly label: string
    totalUnits: number
    completedUnits: number
}

export interface TaskOptions {
    readonly label: string
    readonly totalUnits: number
}

export interface TaskBag {
    /**
     * Advance the pending task.
     *
     * @param amount How much to advance by. Defaults to 1.
     */
    readonly advance: (amount?: number) => void

    /**
     * Report a failure which was handled.
     *
     * @param reason The reason for the failure.
     */
    readonly handledFailure: (reason: unknown) => void
}

export type TaskProgressReporterEvent =
    | { type: "taskStarted"; id: number }
    | { type: "taskProgressed"; id: number; totalUnits: number; completedUnits: number }
    | { type: "taskEnded"; id: number }
    | { type: "taskFailed"; id: number; label: string; reason: unknown; handled: boolean }

export class TaskProgressReporter {
    private readonly _taskDetails: Map<number, TaskDetails>
    private _nextId: number
    private readonly _dispatch: EventDispatch<TaskProgressReporterEvent>

    constructor() {
        this._taskDetails = new Map()
        this._nextId = 0
        ;[this._dispatch, this.subscribe] = createEvent({
            label: "TaskReporter",
            awaitSubscribers: false,
        })
    }

    readonly subscribe: EventSubscribe<TaskProgressReporterEvent>

    get activeTaskCount(): number {
        return this._taskDetails.size
    }

    get completedPercent(): number {
        let total = 0
        let completed = 0
        for (const details of this._taskDetails.values()) {
            total += details.totalUnits
            completed += details.completedUnits
        }
        return total !== 0 ? completed / total : 0
    }

    get activeTaskIds(): Iterable<number> {
        return this._taskDetails.keys()
    }

    getTaskLabel(id: number): string | undefined {
        const details = this._taskDetails.get(id)
        if (details === undefined) {
            return undefined
        }
        return details.label
    }

    getTaskPercent(id: number): number | undefined {
        const details = this._taskDetails.get(id)
        if (details === undefined) {
            return undefined
        }
        return details.completedUnits / details.totalUnits
    }

    private _startTask(options: TaskOptions): [number, TaskDetails] {
        const details: TaskDetails = {
            label: options.label,
            totalUnits: options.totalUnits,
            completedUnits: 0,
        }
        const id = this._nextId++
        this._taskDetails.set(id, details)
        void this._dispatch({ type: "taskStarted", id })
        return [id, details]
    }

    private _failTask(id: number, label: string, reason: unknown, handled: boolean) {
        if (!handled && !this._taskDetails.delete(id)) {
            return
        }
        void this._dispatch({ type: "taskFailed", id, label, reason, handled })
    }

    private _endTask(id: number) {
        if (this._taskDetails.delete(id)) {
            void this._dispatch({ type: "taskEnded", id })
        }
    }

    async perform<R>(options: TaskOptions, task: (bag: TaskBag) => Promise<R>): Promise<R> {
        if (options.totalUnits <= 0) {
            throw new Error("Invalid total for task")
        }
        const [id, details] = this._startTask(options)
        try {
            const advance = (amount: number = 1) => {
                details.completedUnits = Math.max(
                    0,
                    Math.min(details.totalUnits, details.completedUnits + amount),
                )
                void this._dispatch({
                    type: "taskProgressed",
                    id,
                    totalUnits: details.totalUnits,
                    completedUnits: details.completedUnits,
                })
            }
            const fail = (reason: unknown) => {
                this._failTask(id, details.label, reason, true)
            }
            const result = await task({ advance, handledFailure: fail })
            this._endTask(id)
            return result
        } catch (reason) {
            this._failTask(id, details.label, reason, false)
            throw reason
        }
    }
}
