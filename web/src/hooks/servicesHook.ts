import { useEffect, useState } from "react"

import type { ServiceOfType, ServiceType } from "@/services/base"

import useServiceRegistry from "@/hooks/serviceRegistryHook"

export default function useServices<TType extends ServiceType>(
    type: TType,
): readonly ServiceOfType<TType>[] {
    const registry = useServiceRegistry()
    // NOTE: This cannot use the useSyncExternalStore hook because
    //       the result of calling serviceRegistry.services is not
    //       guaranteed to be stable across renders.
    const [services, setServices] = useState<readonly ServiceOfType<TType>[]>(() =>
        registry.getAllServices(type),
    )
    useEffect(() => {
        const subscription = registry.$events.subscribe(async (event) => {
            switch (event.type) {
                case "serviceAdded":
                case "serviceRemoved":
                    setServices(registry.getAllServices(type))
                    break
                default:
                    break
            }
        })
        return () => subscription.unsubscribe()
    }, [registry, type])
    return services
}
