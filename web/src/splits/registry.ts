import type { SplitDefinition } from "@/splits/base"

import { NowPlayingSplit } from "@/splits/definitions/NowPlayingSplit"
import { createEvent, type EventSink, type EventStream } from "@/utilities/events"

export type SplitRegistryEvent =
    | { type: "splitDefinitionAdded"; id: string }
    | { type: "splitDefinitionRemove"; id: string }

export default class SplitRegistry {
    private _splitDefinitions: Map<string, SplitDefinition>
    private readonly _events: EventSink<SplitRegistryEvent>

    constructor() {
        this._splitDefinitions = new Map()
        ;[this._events, this.$events] = createEvent<SplitRegistryEvent>()

        // TODO: Don't hard code this
        this.registerSplit(NowPlayingSplit)
    }

    readonly $events: EventStream<SplitRegistryEvent>

    all(): Iterable<SplitDefinition> {
        return this._splitDefinitions.values()
    }

    get(id: string): SplitDefinition | undefined {
        return this._splitDefinitions.get(id)
    }

    registerSplit(splitDefinition: SplitDefinition) {
        const id = splitDefinition.id
        if (this._splitDefinitions.has(id)) {
            throw new Error(`Split definition with id ${id} already exists`)
        }
        this._splitDefinitions.set(id, splitDefinition)
        this._events.dispatch({ type: "splitDefinitionAdded", id: id })
    }

    unregisterSplit(id: string) {
        const deleted = this._splitDefinitions.delete(id)
        if (deleted) {
            this._events.dispatch({ type: "splitDefinitionRemove", id })
        }
        return deleted
    }
}
