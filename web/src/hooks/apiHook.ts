import type { API } from "@magritte/api"
import { useRouteContext } from "@tanstack/react-router"

export default function useAPI(): API {
    const api = useRouteContext({
        from: "__root__",
        select: (context) => context.api,
    })
    return api
}
