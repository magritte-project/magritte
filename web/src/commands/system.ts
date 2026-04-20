import { createEvent, EventSink, EventStream } from "@magritte/sdk/utilities"
import Fuse, { type FuseResult } from "fuse.js"

import type { CommandDefinition } from "@/commands/definition"

import {
    isOnScreenEntityOfKind,
    OnScreenContext,
    type OnScreenEntityKind,
    type OnScreenEntityOfKind,
} from "@/commands/onScreen"
import { CommandRegistry } from "@/commands/registry"

export type CommandSystemEvent = { type: "availableCommandsDidChange" }

export class CommandSystem {
    private readonly _events: EventSink<CommandSystemEvent>
    private readonly _fuse: Fuse<CommandDefinition>

    constructor() {
        ;[this._events, this.$events] = createEvent<CommandSystemEvent>()
        this._fuse = new Fuse<CommandDefinition>([], {
            keys: ["displayName", "description"],
            includeScore: true,
        })
        this.registry = new CommandRegistry()
        this.registry.$events.subscribe((event) => {
            if (event.type === "registeredCommandsDidChange") {
                this._rebuildIndex()
            }
        })
        this.onScreenContext = new OnScreenContext()
        this.onScreenContext.$events.subscribe((event) => {
            if (event.type === "onScreenEntitiesDidChange") {
                this._rebuildIndex()
            }
        })

        this._rebuildIndex()
    }

    readonly registry: CommandRegistry
    readonly onScreenContext: OnScreenContext
    readonly $events: EventStream<CommandSystemEvent>

    private _rebuildIndex() {
        const entityKinds = new Set<OnScreenEntityKind>()
        for (const entity of this.onScreenContext.entities) {
            entityKinds.add(entity.kind)
        }

        const availableCommands: CommandDefinition[] = []
        for (const command of this.registry.commands) {
            if (command.requires.every((kind) => entityKinds.has(kind))) {
                availableCommands.push(command)
            }
        }

        this._fuse.setCollection(availableCommands)
        console.log(availableCommands)

        this._events.dispatch({ type: "availableCommandsDidChange" })
    }

    search(query: string): FuseResult<CommandDefinition>[] {
        return this._fuse.search(query)
    }

    execute(command: CommandDefinition) {
        return command.execute({
            getOnScreenEntities: <TKind extends "userSession" | "library">(
                kind: TKind,
            ): readonly OnScreenEntityOfKind<TKind>[] => {
                const matchingEntities: OnScreenEntityOfKind<TKind>[] = []
                for (const entity of this.onScreenContext.entities) {
                    if (isOnScreenEntityOfKind(entity, kind)) {
                        matchingEntities.push(entity)
                    }
                }
                return matchingEntities
            },
        })
    }
}
