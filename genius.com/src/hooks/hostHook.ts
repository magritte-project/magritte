import type { RPCObject } from "@magritte/rpc"
import { useRouteContext } from "@tanstack/react-router"

export default function useHost(): RPCObject {
    const host = useRouteContext({
        from: "__root__",
        select: (context) => context.host,
    })
    return host
}
