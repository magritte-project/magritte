import type { ExtensionHost } from "@magritte/sdk/connection"

import { useRouteContext } from "@tanstack/react-router"

export default function useExtensionHost(): ExtensionHost {
    const host = useRouteContext({
        from: "__root__",
        select: (context) => context.extensionHost,
    })
    return host
}
