import type { Split, SplitID, SplitInsertOrder, SplitLocation, SplitParameter } from "@/splits/base"

function _insert(oldSplits: readonly Split[], newSplit: Split, insertOrder: SplitInsertOrder) {
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
        readonly start: readonly Split[] = [],
        readonly end: readonly Split[] = [],
    ) {}

    has(splitID: SplitID): boolean {
        return (
            this.start.some((split) => split.id === splitID) ||
            this.end.some((split) => split.id === splitID)
        )
    }

    *idsFor(location: SplitLocation): IterableIterator<SplitID> {
        for (const split of this[location]) {
            yield split.id
        }
    }

    add(
        newSplitID: SplitID,
        allowsMultiple: boolean,
        parameters: readonly SplitParameter[],
        location: SplitLocation,
        insertOrder: SplitInsertOrder,
    ): SplitState {
        if (!allowsMultiple && this.has(newSplitID)) {
            return this
        }
        switch (location) {
            case "start":
                return new SplitState(
                    _insert(this.start, { id: newSplitID, parameters }, insertOrder),
                    this.end,
                )
            case "end":
                return new SplitState(
                    this.start,
                    _insert(this.end, { id: newSplitID, parameters }, insertOrder),
                )
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
