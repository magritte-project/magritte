import type { ServiceRegistry } from "@/services/registry"
import { createContext } from "react"

export const ServiceRegistryContext = createContext<
    ServiceRegistry | undefined
>(undefined)
