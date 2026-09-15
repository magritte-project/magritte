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

function getCatalogSearchCommandID(manifest: ExtensionManifest) {
    return `${manifest.id}:catalog.search`
}

function getCatalogSearchCommands(manifest: ExtensionManifest): readonly Command[] {
    if (!manifest.catalogSearch) {
        return []
    }
    return [
        {
            id: getCatalogSearchCommandID(manifest),
            searchTerms: `${manifest.name} search catalog streaming music songs`,
            requiredInputKinds: [],
            view: { type: "catalogSearch", extensionId: manifest.id },
            present: async () => ({ displayName: `${manifest.name}: Search…` }),
            execute: async () => {
                throw new Error("Catalog search can only be presented in the command palette")
            },
        },
    ]
}

async function getExtensionCommands(extension: Extension): Promise<readonly Command[]> {
    const definitions = extension.manifest.commands ?? []
    if (definitions.length === 0) {
        return []
    }

    try {
        const responder = await extension.commandResponder()
        return definitions.map((definition): Command => ({
            id: getExtensionCommandID(extension.manifest, definition),
            searchTerms: `${extension.manifest.name} ${definition.searchTerms}`,
            requiredInputKinds: definition.requiredInputKinds,
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
        }))
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
    private readonly _searchIndex: Fuse<Command>

    /**
     * The registered commands, tracked separately from the search index.
     *
     * `Fuse#remove` replaces its internal collection with a filtered copy while
     * `Fuse#getIndex().docs` keeps pointing at the original array, so the index's
     * docs go stale after the first removal and miss every command added later.
     */
    private _commands: readonly Command[]

    constructor() {
        ;[this._events, this.$events] = createEvent({ label: "CommandRegistry" })
        this._registeredCommandIDs = new Set()
        this._searchIndex = new Fuse<Command>([], {
            keys: ["searchTerms" satisfies keyof Command],
        })
        this._commands = []
    }

    readonly $events: EventStream<CommandRegistryEvent>

    get all(): readonly Command[] {
        return this._commands
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
            this._searchIndex.add(command)
            this._registeredCommandIDs.add(command.id)
        }
        this._commands = [...this._commands, ...commands]
        this._events({ type: "registeredCommandsDidChange" })
    }

    removeByID(...commandIDs: string[]): boolean {
        const toRemove = new Set(commandIDs)
        const deletedCommands = this._searchIndex.remove((doc) => toRemove.has(doc.id))
        const deleted = deletedCommands.length > 0
        if (deleted) {
            for (const command of deletedCommands) {
                this._registeredCommandIDs.delete(command.id)
            }
            this._commands = this._commands.filter((command) => !toRemove.has(command.id))
            this._events({ type: "registeredCommandsDidChange" })
        }
        return deleted
    }

    remove(...commands: Command[]): boolean {
        return this.removeByID(...commands.map((d) => d.id))
    }

    getByID(id: string): Command | undefined {
        return this._commands.find((command) => command.id === id)
    }

    search(query: string): Command[] {
        return this._searchIndex.search(query).map((match) => match.item)
    }

    wireUpExtensions(extensionRuntime: ExtensionRuntime): void {
        Promise.allSettled(
            extensionRuntime.running.map(async (extension) => {
                const commands = await getExtensionCommands(extension)
                this.add(...commands, ...getCatalogSearchCommands(extension.manifest))
            }),
        )
        extensionRuntime.$events(async (event) => {
            switch (event.type) {
                case "extensionLoaded": {
                    const commands = await getExtensionCommands(event.extension)
                    this.add(...commands, ...getCatalogSearchCommands(event.extension.manifest))
                    console.debug("Registered commands for extension", event.extension.manifest.id)
                    break
                }
                case "extensionUnloaded": {
                    const definitions = event.extension.manifest.commands ?? []
                    const commandIDs = definitions.map((definition) =>
                        getExtensionCommandID(event.extension.manifest, definition),
                    )
                    this.removeByID(
                        ...commandIDs,
                        getCatalogSearchCommandID(event.extension.manifest),
                    )
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
