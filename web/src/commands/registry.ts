import type { ExtensionCommand, ExtensionManifest } from "@magritte/api"
import type { Extension } from "@magritte/sdk"
import Fuse from "fuse.js"

import type { Command } from "@/commands/base"
import type { CommandInputs } from "@/commands/inputs/base"
import type { ExtensionRuntime } from "@/extensions/runtime"
import { createEvent, type EventSink, type EventStream } from "@/utilities/events"

function getExtensionCommandID(manifest: ExtensionManifest, definition: ExtensionCommand) {
    return `${manifest.id}:${definition.id}`
}

async function getExtensionCommands(extension: Extension): Promise<readonly Command[]> {
    const definitions = extension.manifest.commands ?? []
    if (definitions.length === 0) {
        return []
    }

    try {
        const responder = await extension.commandResponder()
        return definitions.map(
            (definition): Command => ({
                id: getExtensionCommandID(extension.manifest, definition),
                searchTerms: `${extension.manifest.name} ${definition.searchTerms}`,
                requiredInputKinds: definition.requiredInputKinds,
                highlightAvailability: definition.highlightAvailability ?? false,
                present: async (inputs: CommandInputs) => {
                    try {
                        const presentation = await responder.presentCommand({
                            id: definition.id,
                            inputs: inputs.allMatching(definition.requiredInputKinds),
                        })
                        return {
                            ...presentation,
                            displayName: `${extension.manifest.name}: ${presentation.displayName}`,
                        }
                    } catch (error) {
                        console.error(
                            "*** Could not get presentation for command",
                            error,
                            extension.manifest.id,
                            definition.id,
                        )
                        return {
                            displayName: `${extension.manifest.name}: ???`,
                            disabled: true,
                        }
                    }
                },
                execute: async (inputs: CommandInputs) => {
                    return await responder.executeCommand({
                        id: definition.id,
                        inputs: inputs.allMatching(definition.requiredInputKinds),
                    })
                },
            }),
        )
    } catch (error) {
        console.error(
            "*** Extension declares commands in manifest but does not export a responder",
            extension.manifest.id,
            error,
        )
        return []
    }
}

export type CommandRegistryEvent = { type: "registeredCommandsDidChange" }

export class CommandRegistry {
    private readonly _events: EventSink<CommandRegistryEvent>
    private readonly _registeredCommandIDs: Set<string>
    private readonly _commands: Fuse<Command>

    constructor() {
        ;[this._events, this.$events] = createEvent({ label: "CommandRegistry" })
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
        this._events({ type: "registeredCommandsDidChange" })
    }

    removeByID(...commandIDs: string[]): boolean {
        const toRemove = new Set(commandIDs)
        const deletedCommands = this._commands.remove((doc) => toRemove.has(doc.id))
        const deleted = deletedCommands.length > 0
        if (deleted) {
            for (const command of deletedCommands) {
                this._registeredCommandIDs.delete(command.id)
            }
            this._events({ type: "registeredCommandsDidChange" })
        }
        return deleted
    }

    remove(...commands: Command[]): boolean {
        return this.removeByID(...commands.map((d) => d.id))
    }

    getByID(id: string): Command | undefined {
        return this._commands.getIndex().docs.find((doc) => doc.id === id)
    }

    search(query: string): Command[] {
        return this._commands.search(query).map((match) => match.item)
    }

    wireUpExtensions(extensionRuntime: ExtensionRuntime): void {
        Promise.allSettled(
            extensionRuntime.running.map(async (extension) => {
                const commands = await getExtensionCommands(extension)
                this.add(...commands)
            }),
        )
        extensionRuntime.$events(async (event) => {
            switch (event.type) {
                case "extensionLoaded": {
                    const commands = await getExtensionCommands(event.extension)
                    this.add(...commands)
                    console.debug("Registered commands for extension", event.extension.manifest.id)
                    break
                }
                case "extensionUnloaded": {
                    const definitions = event.extension.manifest.commands ?? []
                    const commandIDs = definitions.map((definition) =>
                        getExtensionCommandID(event.extension.manifest, definition),
                    )
                    this.removeByID(...commandIDs)
                    console.debug(
                        "Unregistered commands for extension",
                        event.extension.manifest.id,
                    )
                    break
                }
                default: {
                    break
                }
            }
        })
    }
}
