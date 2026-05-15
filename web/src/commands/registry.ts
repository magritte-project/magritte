import { createEvent, type EventSink, type EventStream } from "@magritte/sdk/utilities"
import Fuse from "fuse.js"

import type { Command } from "@/commands/base"

export type CommandRegistryEvent = { type: "registeredCommandsDidChange" }

export class CommandRegistry {
    private readonly _events: EventSink<CommandRegistryEvent>
    private readonly _commands: Fuse<Command>

    constructor() {
        ;[this._events, this.$events] = createEvent<CommandRegistryEvent>()
        this._commands = new Fuse<Command>([], {
            keys: ["searchTerms" satisfies keyof Command],
        })
    }

    readonly $events: EventStream<CommandRegistryEvent>

    add(...commands: Command[]): void {
        for (const command of commands) {
            this._commands.add(command)
        }
        this._events.dispatch({ type: "registeredCommandsDidChange" })
    }

    remove(...commands: Command[]): boolean {
        const toRemove = new Set(commands.map((d) => d.id))
        const deletedCommands = this._commands.remove((doc) => toRemove.has(doc.id))
        const deleted = deletedCommands.length > 0
        if (deleted) {
            this._events.dispatch({ type: "registeredCommandsDidChange" })
        }
        return deleted
    }

    search(query: string): Command[] {
        return this._commands.search(query).map((match) => match.item)
    }
}
