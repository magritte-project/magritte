import { useRouteContext } from "@tanstack/react-router"

import type { ExtensionRuntime } from "@/extensions/runtime"

export default function useExtensionRuntime(): ExtensionRuntime {
    const extensionRuntime = useRouteContext({
        from: "__root__",
        select: (context) => context.extensionRuntime,
    })
    return extensionRuntime
}
