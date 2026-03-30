import { useRouteContext } from "@tanstack/react-router"

import type { ExtensionManager } from "@/extensions/extensionManager"

export default function useExtensionManager(): ExtensionManager {
    const extensionManager = useRouteContext({
        from: "__root__",
        select: (context) => context.extensionManager,
    })
    return extensionManager
}
