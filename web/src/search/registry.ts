import type { SearchResponder } from "@magritte/sdk"

import { createEvent, type EventDispatch, type EventSubscribe } from "@/utilities/events"

export type SearchRegistryEvent = { type: "registeredRespondersChanged" }

export class SearchRegistry {
    private readonly _dispatch: EventDispatch<SearchRegistryEvent>
    private _responders: readonly SearchResponder[]

    constructor() {
        ;[this._dispatch, this.subscribe] = createEvent<SearchRegistryEvent>()
        this._responders = []
    }

    readonly subscribe: EventSubscribe<SearchRegistryEvent>

    add(responder: SearchResponder): () => void {
        this._responders = [...this._responders, responder]
        this._dispatch({ type: "registeredRespondersChanged" })
        return () => {
            const toRemove = this._responders.indexOf(responder)
            if (toRemove !== -1) {
                const responders = [...this._responders]
                responders.splice(toRemove, 1)
                this._responders = responders
                this._dispatch({ type: "registeredRespondersChanged" })
            }
        }
    }
}
