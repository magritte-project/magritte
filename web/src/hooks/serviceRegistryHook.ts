import { useRouteContext } from "@tanstack/react-router"

import type { ServiceRegistry } from "@/services/registry"

export default function useServiceRegistry(): ServiceRegistry {
    const serviceRegistry = useRouteContext({
        from: "__root__",
        select: (context) => context.serviceRegistry,
    })
    return serviceRegistry
}
