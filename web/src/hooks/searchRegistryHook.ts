import { useRouteContext } from "@tanstack/react-router"

import type { SearchRegistry } from "@/search/registry"

export default function useSearchRegistry(): SearchRegistry {
    const searchRegistry = useRouteContext({
        from: "__root__",
        select: (context) => context.searchRegistry,
    })
    return searchRegistry
}
