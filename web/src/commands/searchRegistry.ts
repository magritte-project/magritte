import type { Extension } from "@magritte/sdk"

import type { SearchCommand, SearchCommandItem, SearchCommandSection } from "@/commands/base"
import type { CommandInputs } from "@/commands/inputs/base"
import type { ExtensionRuntime } from "@/extensions/runtime"
import { createEvent, type EventDispatch, type EventSubscribe } from "@/utilities/events"

async function getExtensionSearchCommand(extension: Extension): Promise<SearchCommand | undefined> {
    try {
        if (!extension.manifest.searchCommand) {
            return undefined
        }
        const id = extension.manifest.id
        const requiredInputKinds = extension.manifest.searchCommand.requiredInputKinds
        const responder = await extension.searchCommandResponder()
        return {
            id,
            requiredInputKinds,
            async search(query: string, inputs: CommandInputs): Promise<SearchCommandSection[]> {
                const sections = await responder.search({
                    query,
                    inputs: inputs.allMatching(requiredInputKinds),
                })
                return sections.map((extensionSection) => {
                    return {
                        displayName: extensionSection.displayName,
                        items: extensionSection.items.map((extensionItem) => {
                            return {
                                id: extensionItem.id,
                                icon: extensionItem.icon,
                                title: extensionItem.title,
                                subtitle: extensionItem.subtitle,
                                addToLibrary: extensionItem.supportedEffects?.includes(
                                    "addToLibrary",
                                )
                                    ? () =>
                                          responder.executeAddToLibrary({
                                              id: extensionItem.id,
                                              inputs: inputs.allMatching(requiredInputKinds),
                                          })
                                    : undefined,
                                play: extensionItem.supportedEffects?.includes("play")
                                    ? () =>
                                          responder.executePlay({
                                              id: extensionItem.id,
                                              inputs: inputs.allMatching(requiredInputKinds),
                                          })
                                    : undefined,
                                reveal: extensionItem.supportedEffects?.includes("reveal")
                                    ? () =>
                                          // TODO: Also show the extension in the app
                                          responder.executeReveal({
                                              id: extensionItem.id,
                                              inputs: inputs.allMatching(requiredInputKinds),
                                          })
                                    : undefined,
                            }
                        }),
                    }
                })
            },
        }
    } catch (error) {
        console.error(
            "*** Extension declares search command in manifest but does not export a responder",
            extension.manifest.id,
            error,
        )
        return undefined
    }
}

export type SearchRegistryEvent = { type: "registeredCommandsDidChange" }

export class SearchRegistry {
    private readonly _dispatch: EventDispatch<SearchRegistryEvent>
    private _commands: readonly SearchCommand[]

    constructor() {
        ;[this._dispatch, this.subscribe] = createEvent<SearchRegistryEvent>()
        this._commands = []
    }

    readonly subscribe: EventSubscribe<SearchRegistryEvent>

    add(command: SearchCommand): () => void {
        this._commands = [...this._commands, command]
        void this._dispatch({ type: "registeredCommandsDidChange" })
        return () => {
            const toRemove = this._commands.indexOf(command)
            if (toRemove !== -1) {
                const commands = [...this._commands]
                commands.splice(toRemove, 1)
                this._commands = commands
                void this._dispatch({ type: "registeredCommandsDidChange" })
            }
        }
    }

    wireUpExtensions(extensionRuntime: ExtensionRuntime): void {
        const removes = new Map<string, () => void>()

        void Promise.allSettled(
            extensionRuntime.running.map(async (extension) => {
                const searchCommand = await getExtensionSearchCommand(extension)
                if (searchCommand) {
                    const remove = this.add(searchCommand)
                    removes.set(extension.manifest.id, remove)
                }
            }),
        )
        extensionRuntime.subscribe(async (event) => {
            switch (event.type) {
                case "extensionLoaded": {
                    const searchCommand = await getExtensionSearchCommand(event.extension)
                    if (searchCommand) {
                        const remove = this.add(searchCommand)
                        removes.set(event.extension.manifest.id, remove)
                        console.debug(
                            "Registered search command for extension",
                            event.extension.manifest.id,
                        )
                    }
                    break
                }
                case "extensionUnloaded": {
                    const remove = removes.get(event.extension.manifest.id)
                    if (remove) {
                        remove()
                        removes.delete(event.extension.manifest.id)
                    }
                    console.debug(
                        "Unregistered search command for extension",
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

    async search(query: string, inputs: CommandInputs): Promise<SearchCommandSection[]> {
        if (!query) {
            return []
        }
        const sectionsByCommand = await Promise.all(
            this._commands.map((command) => command.search(query, inputs)),
        )

        const itemsByDisplayName = new Map<string, SearchCommandItem[]>()
        for (const section of sectionsByCommand.flat()) {
            const items = itemsByDisplayName.get(section.displayName)
            if (items) {
                items.push(...section.items)
            } else {
                itemsByDisplayName.set(section.displayName, [...section.items])
            }
        }

        return [...itemsByDisplayName.entries()]
            .map(([displayName, items]) => ({ displayName, items }))
            .filter((section) => section.items.length > 0)
    }
}
