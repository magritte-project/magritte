import type { Split, SplitDefinition, SplitID, SplitParameter } from "@/splits/base"

import { GeniusComSplit } from "@/splits/definitions/GeniusComSplit"
import { QuickMixSplit } from "@/splits/definitions/QuickMixSplit"
import { SongEditorSplit } from "@/splits/definitions/SongEditorSplit"
import { createEvent, type EventSink, type EventStream } from "@/utilities/events"

export type SplitRegistryEvent =
    | { type: "splitDefinitionAdded"; id: SplitID }
    | { type: "splitDefinitionRemove"; id: SplitID }

export default class SplitRegistry {
    private _splitDefinitions: Map<SplitID, SplitDefinition>
    private readonly _events: EventSink<SplitRegistryEvent>

    constructor() {
        this._splitDefinitions = new Map()
        ;[this._events, this.$events] = createEvent<SplitRegistryEvent>()

        // TODO: Don't hard code this
        this.registerSplit(QuickMixSplit)
        this.registerSplit(SongEditorSplit)
        this.registerSplit(GeniusComSplit)
    }

    readonly $events: EventStream<SplitRegistryEvent>;

    *allOpenable(): IterableIterator<SplitDefinition> {
        for (const definition of this._splitDefinitions.values()) {
            if (!definition.requiresParameters) {
                yield definition
            }
        }
    }

    get(id: SplitID): SplitDefinition | undefined {
        return this._splitDefinitions.get(id)
    }

    *getAll(
        splits: Iterable<Split>,
    ): IterableIterator<[SplitDefinition, readonly SplitParameter[], number]> {
        let index = 0
        for (const { id, parameters } of splits) {
            const split = this.get(id)
            if (split) {
                yield [split, parameters, index++]
            }
        }
    }

    registerSplit(splitDefinition: SplitDefinition) {
        const id = splitDefinition.id
        if (this._splitDefinitions.has(id)) {
            throw new Error(`Split definition with id ${id} already exists`)
        }
        this._splitDefinitions.set(id, splitDefinition)
        this._events.dispatch({ type: "splitDefinitionAdded", id: id })
    }

    unregisterSplit(id: SplitID) {
        const deleted = this._splitDefinitions.delete(id)
        if (deleted) {
            this._events.dispatch({ type: "splitDefinitionRemove", id })
        }
        return deleted
    }
}
