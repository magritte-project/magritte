import type { Extension, ExtensionCommand, ExtensionManifest } from "@magritte/sdk"
import { GearIcon } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"

import type { Command } from "@/commands/base"
import type { CommandInputs } from "@/commands/inputs/base"
import type { CommandRegistry } from "@/commands/registry"
import type { ExtensionRuntime } from "@/extensions/runtime"
import useExtensionRuntime from "@/hooks/extensionRuntimeHook"
import { getErrorMessage } from "@/utilities/errors"
import type { PanelDefinition, PanelRegistry } from "@/utilities/panelRegistry"

export function buildExtensionComponent(id: string) {
    function ExtensionComponent() {
        const extensionRuntime = useExtensionRuntime()
        const containerRef = useRef<HTMLDivElement | null>(null)
        const [error, setError] = useState<unknown | null>(null)

        useEffect(() => {
            if (!containerRef.current) {
                return
            }

            const subscription = extensionRuntime.$events.subscribe((event) => {
                switch (event.type) {
                    case "extensionLoaded":
                        if (event.extension.manifest.id === id) {
                            setError(null)
                        }
                        break
                    case "extensionLoadFailed":
                        if (event.manifest.id === id) {
                            setError(event.error)
                        }
                        break
                    default:
                        break
                }
            })

            const container = containerRef.current
            extensionRuntime.attach(id, container)

            return () => {
                extensionRuntime.detach(id, container)
                subscription.unsubscribe()
            }
        }, [extensionRuntime])

        return (
            <div
                ref={containerRef}
                className="h-full flex flex-col gap-3 items-center justify-center"
            >
                <GearIcon size="4rem" weight="light" className="text-gray-200" />
                {error !== null && (
                    <div className="px-3 text-center text-sm font-medium text-gray-600">
                        {getErrorMessage(error)}
                    </div>
                )}
            </div>
        )
    }
    return ExtensionComponent
}

export function getExtensionPanelID(manifest: ExtensionManifest): string {
    return `extension.${manifest.id}`
}

export function getExtensionPanelDefinition(manifest: ExtensionManifest): PanelDefinition {
    return {
        id: getExtensionPanelID(manifest),
        name: manifest.name,
        icon: GearIcon,
        preferredWidth: manifest.preferredWidth,
        preferredHeight: manifest.preferredHeight,
        component: buildExtensionComponent(manifest.id),
    }
}

export function wireExtensionPanels(
    panelRegistry: PanelRegistry,
    extensionRuntime: ExtensionRuntime,
): void {
    for (const manifest of extensionRuntime.available) {
        panelRegistry.register(getExtensionPanelDefinition(manifest))
    }
    extensionRuntime.$events.subscribe((event) => {
        switch (event.type) {
            case "extensionAdded": {
                panelRegistry.register(getExtensionPanelDefinition(event.manifest))
                break
            }
            case "extensionRemoved": {
                panelRegistry.unregister(getExtensionPanelID(event.manifest))
                break
            }
            default: {
                break
            }
        }
    })
}

function getExtensionCommandID(manifest: ExtensionManifest, definition: ExtensionCommand) {
    return `${manifest.id}:${definition.id}`
}

export async function getExtensionCommands(extension: Extension): Promise<readonly Command[]> {
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

export function wireExtensionCommands(
    commandRegistry: CommandRegistry,
    extensionRuntime: ExtensionRuntime,
): void {
    Promise.allSettled(
        extensionRuntime.running.map(async (extension) => {
            const commands = await getExtensionCommands(extension)
            commandRegistry.add(...commands)
        }),
    )
    extensionRuntime.$events.subscribe(async (event) => {
        switch (event.type) {
            case "extensionLoaded": {
                const commands = await getExtensionCommands(event.extension)
                commandRegistry.add(...commands)
                console.debug("Registered commands for extension", event.extension.manifest.id)
                break
            }
            case "extensionUnloaded": {
                const definitions = event.extension.manifest.commands ?? []
                const commandIDs = definitions.map((definition) =>
                    getExtensionCommandID(event.extension.manifest, definition),
                )
                commandRegistry.removeByID(...commandIDs)
                console.debug("Unregistered commands for extension", event.extension.manifest.id)
                break
            }
            default: {
                break
            }
        }
    })
}
