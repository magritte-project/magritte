import type { ExtensionManifest } from "@magritte/api"
import type { Panel as ExtensionPanel } from "@magritte/sdk"

import type { ExtensionRuntime } from "@/extensions/runtime"

export function exportPanel(
    manifest: ExtensionManifest,
    extensionRuntime: ExtensionRuntime,
): ExtensionPanel {
    return {
        close: async () => {
            extensionRuntime.requestClose(manifest.id)
        },
    }
}
