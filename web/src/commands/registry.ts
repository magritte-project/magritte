import { createEvent, type EventSink, type EventStream } from "@magritte/sdk/utilities"
import Fuse from "fuse.js"

import type { CommandDefinition } from "@/commands/definition"

export type CommandRegistryEvent = { type: "registeredCommandsDidChange" }

export class CommandRegistry {
    private readonly _events: EventSink<CommandRegistryEvent>
    private readonly _commands: Fuse<CommandDefinition>

    constructor() {
        ;[this._events, this.$events] = createEvent<CommandRegistryEvent>()
        this._commands = new Fuse<CommandDefinition>([], {
            keys: ["searchTerms" satisfies keyof CommandDefinition],
        })
    }

    readonly $events: EventStream<CommandRegistryEvent>

    register(...definitions: CommandDefinition[]): void {
        for (const definition of definitions) {
            this._commands.add(definition)
        }
        this._events.dispatch({ type: "registeredCommandsDidChange" })
    }

    unregister(definition: CommandDefinition): boolean {
        const deletedCommands = this._commands.remove((doc) => doc.id === definition.id)
        const deleted = deletedCommands.length > 0
        if (deleted) {
            this._events.dispatch({ type: "registeredCommandsDidChange" })
        }
        return deleted
    }

    search(query: string): CommandDefinition[] {
        return this._commands.search(query).map((match) => match.item)
    }
}
