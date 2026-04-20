import { createEvent, type EventSink, type EventStream } from "@magritte/sdk/utilities"

export type OnScreenEntity =
    | { readonly kind: "userSession" }
    | { readonly kind: "library"; readonly id: number }

export type OnScreenEntityKind = OnScreenEntity["kind"]

export type OnScreenEntityOfKind<TKind extends OnScreenEntityKind> = Extract<
    OnScreenEntity,
    { readonly kind: TKind }
>

export function isOnScreenEntityOfKind<TKind extends OnScreenEntityKind>(
    entity: OnScreenEntity,
    kind: TKind,
): entity is OnScreenEntityOfKind<TKind> {
    return entity.kind === kind
}

export type OnScreenCommandContextEvent = { type: "onScreenEntitiesDidChange" }

export interface PublishedOnScreenEntity {
    readonly id: string
}

/**
 * Coordinates on-screen elements publishing their
 * displayed entities for use by the command system.
 */
export class OnScreenContext {
    private readonly _events: EventSink<OnScreenCommandContextEvent>
    private readonly _entities: Map<string, readonly OnScreenEntity[]>

    constructor() {
        ;[this._events, this.$events] = createEvent<OnScreenCommandContextEvent>()
        this._entities = new Map()
    }

    readonly $events: EventStream<OnScreenCommandContextEvent>

    get entities(): Iterable<OnScreenEntity> {
        const publications = this._entities.values()
        function* iterator() {
            for (const entities of publications) {
                yield* entities
            }
        }
        return iterator()
    }

    publish(entities: readonly OnScreenEntity[]): PublishedOnScreenEntity {
        const id = crypto.randomUUID()
        this._entities.set(id, entities)
        this._events.dispatch({ type: "onScreenEntitiesDidChange" })
        return { id }
    }

    revoke(publication: PublishedOnScreenEntity): boolean {
        const deleted = this._entities.delete(publication.id)
        if (deleted) {
            this._events.dispatch({ type: "onScreenEntitiesDidChange" })
        }
        return deleted
    }
}
