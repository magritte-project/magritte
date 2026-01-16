import type { SplitDefinition, SplitInsertOrder, SplitLocation } from "@/splits/base"

function _insert(
    oldSplits: readonly SplitDefinition[],
    newSplit: SplitDefinition,
    insertOrder: SplitInsertOrder,
) {
    switch (insertOrder) {
        case "first":
            return [newSplit, ...oldSplits]
        case "last":
            return [...oldSplits, newSplit]
    }
}

export default class SplitState {
    constructor(
        readonly start: readonly SplitDefinition[] = [],
        readonly end: readonly SplitDefinition[] = [],
    ) {
        this.allOpenIds = new Set<string>()
        for (const split of start) {
            this.allOpenIds.add(split.id)
        }
        for (const split of end) {
            this.allOpenIds.add(split.id)
        }
    }

    readonly allOpenIds: Set<string>

    add(
        newSplit: SplitDefinition,
        location: SplitLocation,
        insertOrder: SplitInsertOrder,
    ): SplitState {
        if (!newSplit.allowsMultiple && this.allOpenIds.has(newSplit.id)) {
            return this
        }
        switch (location) {
            case "start":
                return new SplitState(_insert(this.start, newSplit, insertOrder), this.end)
            case "end":
                return new SplitState(this.start, _insert(this.end, newSplit, insertOrder))
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
