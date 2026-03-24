import type { ExtensionHostProxy } from "@magritte/sdk/extensions"
import { useRouteContext } from "@tanstack/react-router"

export default function useHost(): ExtensionHostProxy {
    const host = useRouteContext({
        from: "__root__",
        select: (context) => context.host,
    })
    return host
}
