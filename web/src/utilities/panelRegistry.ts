import { createEvent, EventStream, type EventSink } from "@magritte/sdk"
import type { Icon } from "@phosphor-icons/react"

export interface PanelDefinition {
    /** Unique identifier for the panel */
    readonly id: string

    /** The name of the panel */
    readonly name: string

    /** The icon of the panel */
    readonly icon: Icon

    /** The preferred width of the panel */
    readonly preferredWidth: React.CSSProperties["width"]

    /** The preferred height of the panel */
    readonly preferredHeight: React.CSSProperties["height"]

    /** The component which renders the panel */
    readonly component: React.FunctionComponent
}

export type PanelRegistryEvent =
    | { type: "panelRegistered"; id: string }
    | { type: "panelUnregistered"; id: string }

export class PanelRegistry {
    private _definitions: PanelDefinition[]
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
        this._definitions = [...this._definitions, panelDefinition]
        this._events.dispatch({ type: "panelRegistered", id: panelDefinition.id })
    }

    unregister(id: string) {
        const toRemove = this._definitions.findIndex((definition) => definition.id === id)
        if (toRemove !== -1) {
            const definitions = [...this._definitions]
            definitions.splice(toRemove, 1)
            this._definitions = definitions
            this._events.dispatch({ type: "panelUnregistered", id })
        }
    }
}
