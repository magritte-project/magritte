import type { ExtensionManifest } from "@magritte/api"
import { RPCBroadcaster } from "@magritte/rpc"
import {
    type CommandCoordinator,
    CommandInputsDidChange,
    type CommandQueryResult,
} from "@magritte/sdk"

import type { CommandInputs } from "@/commands/inputs/base"
import type { CommandRegistry } from "@/commands/registry"
import { enforcePermissions } from "@/extensions/exports/permissions"

export function exportCommandCoordinator(
    manifest: ExtensionManifest,
    broadcaster: RPCBroadcaster,
    inputs: CommandInputs,
    registry: CommandRegistry,
): CommandCoordinator {
    if (manifest.permissions?.includes("commands:input:read")) {
        const unsubscribe = inputs.subscribe(async (event) => {
            switch (event.type) {
                case "commandInputsDidChange":
                    broadcaster.send(CommandInputsDidChange, undefined)
                    break
                default:
                    break
            }
        })
        broadcaster.subscribe(RPCBroadcaster.invalidated, () => {
            unsubscribe()
        })
    }
    return {
        queryRunnable: enforcePermissions(manifest, ["commands:query"], async ({ query }) => {
            // TODO: Show confirmation before returning matching commands
            const commands = query ? registry.search(query) : registry.all
            return await Promise.all(
                commands
                    .filter((command) => inputs.hasAllOf(...command.requiredInputKinds))
                    .map(async (command) => {
                        const presentation = await command.present(inputs)
                        return {
                            id: command.id,
                            displayName: presentation.displayName,
                        } satisfies CommandQueryResult
                    }),
            )
        }),
        runCommand: enforcePermissions(manifest, ["commands:run"], async ({ id }) => {
            // TODO: Show confirmation before running the command
            const command = registry.getByID(id)
            if (!command) {
                throw new Error(`Command not found: ${id}`)
            }
            if (!inputs.hasAllOf(...command.requiredInputKinds)) {
                throw new Error("Unsatisfied command inputs")
            }
            await command.execute(inputs)
        }),
        addInput: enforcePermissions(manifest, ["commands:input:add"], async (input) => {
            inputs.add(input)
        }),
        removeInput: enforcePermissions(manifest, ["commands:input:add"], async ({ kind, id }) => {
            inputs.remove(kind, id)
        }),
        allMatching: enforcePermissions(manifest, ["commands:input:read"], async ({ kinds }) => {
            // TODO: Show confirmation before returning matching inputs
            return inputs.allMatching(kinds)
        }),
    }
}
