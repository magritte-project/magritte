import type { APIClient } from "@/api/client"
import type { InstanceStatusRead } from "@/api/openapi"
import type { ServiceInitializer } from "@/services/types"

import { initializeAppleMusic } from "@/services/applemusic/initialization"

const INITIALIZERS: Record<string, ServiceInitializer> = {
    applemusic: initializeAppleMusic,
}

const INITIALIZED_SERVICES = new Set<string>()

export function getInitializedServiceNames(): readonly string[] {
    return Array.from(INITIALIZED_SERVICES)
}

export function isServiceInitialized(name: string) {
    return INITIALIZED_SERVICES.has(name)
}

export async function initializeServices(apiClient: APIClient, instanceStatus: InstanceStatusRead) {
    for (const service of instanceStatus.available_services) {
        if (!service.active) {
            console.info(`Skipping inactive service: ${service.name}`)
            continue
        }
        const initialize = INITIALIZERS[service.name]
        if (!initialize) {
            console.info(`Skipping service without initializer: ${service.name}`)
            continue
        }
        await initialize({ apiClient })
        INITIALIZED_SERVICES.add(service.name)
    }
}
