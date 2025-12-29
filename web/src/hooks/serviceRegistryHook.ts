import { ServiceRegistryContext } from "@/contexts/serviceRegistryContext"
import type { ServiceRegistry } from "@/services/registry"
import { useContext } from "react"

export default function useServiceRegistry(): ServiceRegistry {
    const serviceRegistry = useContext(ServiceRegistryContext)
    if (serviceRegistry === undefined) {
        throw new Error(
            "useServiceRegistry() used outside of <ServiceRegistryContext>",
        )
    }
    return serviceRegistry
}
