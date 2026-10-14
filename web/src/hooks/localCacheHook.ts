import { useRouteContext } from "@tanstack/react-router"

import type { LocalCache } from "@/playback/localCache"

export default function useLocalCache(): LocalCache {
    const localCache = useRouteContext({
        from: "__root__",
        select: (context) => context.localCache,
    })
    return localCache
}
