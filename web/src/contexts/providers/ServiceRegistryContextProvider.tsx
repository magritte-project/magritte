import type { ServiceRegistry } from "@/services/registry"
import type { ReactNode } from "react"
import { ServiceRegistryContext } from "@/contexts/serviceRegistryContext"

export interface ServiceRegistryContextProviderProps {
    readonly value: ServiceRegistry
    readonly children?: ReactNode
}

export default function ServiceRegistryContextProvider({
    value,
    children,
}: ServiceRegistryContextProviderProps) {
    return (
        <ServiceRegistryContext.Provider value={value}>
            {children}
        </ServiceRegistryContext.Provider>
    )
}
