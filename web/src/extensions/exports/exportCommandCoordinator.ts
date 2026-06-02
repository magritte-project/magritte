import { RPCBroadcaster } from "@magritte/rpc"
import { type CommandCoordinator, CommandInputsDidChange, ExtensionManifest } from "@magritte/sdk"

import type { CommandInputs } from "@/commands/inputs/base"
import type { CommandRegistry } from "@/commands/registry"
import { enforcePermissions } from "@/extensions/exports/permissions"

export function exportCommandCoordinator(
    manifest: ExtensionManifest,
    broadcaster: RPCBroadcaster,
    inputs: CommandInputs,
    _registry: CommandRegistry,
): CommandCoordinator {
    if (manifest.permissions?.includes("commands:input:read")) {
        const subscription = inputs.$events.subscribe(async (event) => {
            switch (event.type) {
                case "commandInputsDidChange":
                    broadcaster.send(CommandInputsDidChange, undefined)
                    break
                default:
                    break
            }
        })
        broadcaster.subscribe(RPCBroadcaster.invalidated, () => {
            subscription.unsubscribe()
        })
    }
    return {
        addInput: enforcePermissions(manifest, ["commands:input:add"], async (input) => {
            inputs.add(input)
        }),
        removeInput: enforcePermissions(manifest, ["commands:input:add"], async ({ kind, id }) => {
            inputs.remove(kind, id)
        }),
        getInputsMatching: enforcePermissions(
            manifest,
            ["commands:input:read"],
            async ({ kind }) => {
                return inputs.allMatching([kind])
            },
        ),
    }
}
