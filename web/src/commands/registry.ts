import { createEvent, type EventSink, type EventStream } from "@magritte/sdk"
import Fuse from "fuse.js"

import type { Command } from "@/commands/base"

export type CommandRegistryEvent = { type: "registeredCommandsDidChange" }

export class CommandRegistry {
    private readonly _events: EventSink<CommandRegistryEvent>
    private readonly _registeredCommandIDs: Set<string>
    private readonly _commands: Fuse<Command>

    constructor() {
        ;[this._events, this.$events] = createEvent<CommandRegistryEvent>()
        this._registeredCommandIDs = new Set()
        this._commands = new Fuse<Command>([], {
            keys: ["searchTerms" satisfies keyof Command],
        })
    }

    readonly $events: EventStream<CommandRegistryEvent>

    add(...commands: Command[]): void {
        const visitedCommandIDs = new Set<string>()
        for (const command of commands) {
            if (this._registeredCommandIDs.has(command.id) || visitedCommandIDs.has(command.id)) {
                throw new Error(`Command already registered with ID "${command.id}"`)
            }
            visitedCommandIDs.add(command.id)
        }
        for (const command of commands) {
            this._commands.add(command)
            this._registeredCommandIDs.add(command.id)
        }
        this._events.dispatch({ type: "registeredCommandsDidChange" })
    }

    remove(...commands: Command[]): boolean {
        const toRemove = new Set(commands.map((d) => d.id))
        const deletedCommands = this._commands.remove((doc) => toRemove.has(doc.id))
        const deleted = deletedCommands.length > 0
        if (deleted) {
            for (const command of deletedCommands) {
                this._registeredCommandIDs.delete(command.id)
            }
            this._events.dispatch({ type: "registeredCommandsDidChange" })
        }
        return deleted
    }

    search(query: string): Command[] {
        return this._commands.search(query).map((match) => match.item)
    }
}
