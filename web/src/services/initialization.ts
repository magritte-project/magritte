import type { APIClient } from "@/api/client"
import type { InstanceStatusRead } from "@/api/openapi"

import { initializeAppleMusic } from "@/services/applemusic/initialization"
import {
    isServiceOfType,
    type Service,
    type ServiceInitializer,
    type ServiceOfType,
    type ServiceType,
} from "@/services/types"

const INITIALIZERS: ReadonlyMap<string, ServiceInitializer> = new Map().set(
    "applemusic",
    initializeAppleMusic,
)

const INITIALIZED_SERVICES = new Map<string, Service>()

export function getInitializedServiceNames(): readonly string[] {
    return Array.from(INITIALIZED_SERVICES.keys())
}

export function getServicesOfType<TType extends ServiceType>(
    type: TType,
): Map<string, ServiceOfType<TType>> {
    const services = new Map<string, ServiceOfType<TType>>()
    for (const [name, service] of INITIALIZED_SERVICES.entries()) {
        if (isServiceOfType(service, type)) {
            services.set(name, service)
        }
    }
    return services
}

export function isServiceInitialized(name: string) {
    return INITIALIZED_SERVICES.has(name)
}

export async function initializeServices(apiClient: APIClient, instanceStatus: InstanceStatusRead) {
    for (const [name, initialize] of INITIALIZERS.entries()) {
        try {
            const service = await initialize({ apiClient, instanceStatus })
            INITIALIZED_SERVICES.set(name, service)
        } catch (error) {
            console.error(`Failed to initialize service ${name}: ${error}`)
        }
    }
}
