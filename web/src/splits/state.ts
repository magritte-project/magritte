import type { SplitID, SplitInsertOrder, SplitLocation } from "@/splits/base"

function _insert(oldSplits: readonly SplitID[], newSplit: SplitID, insertOrder: SplitInsertOrder) {
    switch (insertOrder) {
        case "first":
            return [newSplit, ...oldSplits]
        case "last":
            return [...oldSplits, newSplit]
    }
}

export default class SplitState {
    static parse(json: string): SplitState {
        const { start, end } = JSON.parse(json)
        return new SplitState(start, end)
    }

    stringify(): string {
        return JSON.stringify({ start: this.start, end: this.end })
    }

    constructor(
        readonly start: readonly SplitID[] = [],
        readonly end: readonly SplitID[] = [],
    ) {}

    has(splitID: SplitID): boolean {
        return this.start.includes(splitID) || this.end.includes(splitID)
    }

    add(
        newSplitID: SplitID,
        allowsMultiple: boolean,
        location: SplitLocation,
        insertOrder: SplitInsertOrder,
    ): SplitState {
        if (!allowsMultiple && this.has(newSplitID)) {
            return this
        }
        switch (location) {
            case "start":
                return new SplitState(_insert(this.start, newSplitID, insertOrder), this.end)
            case "end":
                return new SplitState(this.start, _insert(this.end, newSplitID, insertOrder))
        }
    }

    removeAt(index: number, location: SplitLocation): SplitState {
        switch (location) {
            case "start": {
                const newStart = [...this.start]
                newStart.splice(index, 1)
                return new SplitState(newStart, this.end)
            }
            case "end":
                const newEnd = [...this.end]
                newEnd.splice(index, 1)
                return new SplitState(this.start, newEnd)
        }
    }
}
