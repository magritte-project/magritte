import { createEvent, type EventSink, type EventStream } from "@magritte/sdk/utilities"

import type { CommandDefinition } from "@/commands/definition"

export type CommandRegistryEvent = { type: "registeredCommandsDidChange" }

export class CommandRegistry {
    private readonly _events: EventSink<CommandRegistryEvent>
    private readonly _commands: Map<string, CommandDefinition>

    constructor() {
        ;[this._events, this.$events] = createEvent<CommandRegistryEvent>()
        this._commands = new Map()
    }

    readonly $events: EventStream<CommandRegistryEvent>

    get commands(): Iterable<CommandDefinition> {
        return this._commands.values()
    }

    register(...definitions: CommandDefinition[]): void {
        for (const definition of definitions) {
            this._commands.set(definition.id, definition)
        }
        this._events.dispatch({ type: "registeredCommandsDidChange" })
    }

    unregister(definition: CommandDefinition): boolean {
        const deleted = this._commands.delete(definition.id)
        if (deleted) {
            this._events.dispatch({ type: "registeredCommandsDidChange" })
        }
        return deleted
    }
}
