import { createEvent, EventStream, type EventSink } from "@magritte/sdk"

export interface PanelDefinition {
    /** Unique identifier for the panel */
    readonly id: string

    /** The name of the panel */
    readonly name: string

    /** The preferred width of the panel */
    readonly preferredWidth: React.CSSProperties["width"]

    /** The preferred height of the panel */
    readonly preferredHeight: React.CSSProperties["height"]

    /** The component which renders the panel */
    readonly component: React.FunctionComponent
}

export type PanelRegistryEvent =
    | { type: "panelDefinitionAdded"; id: string }
    | { type: "panelDefinitionRemoved"; id: string }

export class PanelRegistry {
    private readonly _definitions: PanelDefinition[]
    private readonly _events: EventSink<PanelRegistryEvent>

    constructor() {
        this._definitions = []
        ;[this._events, this.$events] = createEvent<PanelRegistryEvent>()
    }

    readonly $events: EventStream<PanelRegistryEvent>

    get definitions(): readonly PanelDefinition[] {
        return this._definitions
    }

    register(panelDefinition: PanelDefinition) {
        if (this._definitions.some((candidate) => candidate.id === panelDefinition.id)) {
            throw new Error(`Panel definition with id ${panelDefinition.id} already exists`)
        }
        this._definitions.push(panelDefinition)
        this._events.dispatch({ type: "panelDefinitionAdded", id: panelDefinition.id })
    }

    unregister(id: string) {
        const toRemove = this._definitions.findIndex((definition) => definition.id === id)
        if (toRemove !== -1) {
            this._definitions.splice(toRemove, 1)
            this._events.dispatch({ type: "panelDefinitionRemoved", id })
        }
    }
}
