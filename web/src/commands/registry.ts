import Fuse from "fuse.js"

import type { Command } from "@/commands/base"
import { createEvent, type EventSink, type EventStream } from "@/utilities/events"

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

    get all(): readonly Command[] {
        return this._commands.getIndex().docs
    }

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

    removeByID(...commandIDs: string[]): boolean {
        const toRemove = new Set(commandIDs)
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

    remove(...commands: Command[]): boolean {
        return this.removeByID(...commands.map((d) => d.id))
    }

    search(query: string): Command[] {
        return this._commands.search(query).map((match) => match.item)
    }
}
