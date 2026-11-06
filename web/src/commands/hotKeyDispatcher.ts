import type { UIEventsKeyPress } from "@magritte/sdk"

export interface HotKeyDefinition {
    /** The key to register for the hot key. */
    readonly key: string

    /** Whether the hot key requires the modifier key (Ctrl or Meta) to be pressed. */
    readonly requiresModifier?: boolean
}
export type UnregisterHotKey = () => void

export class HotKeyDispatcher {
    private _handlers: readonly [HotKeyDefinition, () => boolean][]

    constructor() {
        this._handlers = []
        this.modifierKey =
            navigator.platform.startsWith("Mac") || navigator.platform === "iPhone"
                ? ("meta" as const)
                : ("ctrl" as const)
    }

    readonly modifierKey: "meta" | "ctrl"

    get handlers(): readonly [HotKeyDefinition, () => boolean][] {
        return this._handlers
    }

    register(key: HotKeyDefinition, handler: () => boolean): UnregisterHotKey {
        this._handlers = [...this._handlers, [key, handler]]
        return () => {
            const toRemove = this._handlers.findIndex(
                ([candidateKey, candidateHandler]) =>
                    candidateKey === key && candidateHandler === handler,
            )
            if (toRemove !== -1) {
                const handlers = [...this._handlers]
                handlers.splice(toRemove, 1)
                this._handlers = handlers
            }
        }
    }

    dispatch(event: UIEventsKeyPress): boolean {
        for (const [definition, handler] of this._handlers) {
            if (definition.key !== event.key) {
                continue
            }
            if (
                !(this.modifierKey === "meta" ? event.metaKey : event.ctrlKey) &&
                definition.requiresModifier !== false
            ) {
                continue
            }
            if (!handler()) {
                continue
            }
            return true
        }
        return false
    }
}
