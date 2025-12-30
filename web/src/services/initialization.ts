import type { APIClient } from "@/api/client"
import { initializeAppleMusic } from "@/services/applemusic/initialization"
import type { ServiceInitializer } from "@/services/types"

const INITIALIZERS: Record<string, ServiceInitializer> = {
    applemusic: initializeAppleMusic,
}

const INITIALIZED_SERVICES = new Set<string>()

export function isServiceInitialized(name: string) {
    return INITIALIZED_SERVICES.has(name)
}

export async function initializeServices(apiClient: APIClient) {
    const services = await apiClient.readAvailableServices()
    for (const service of services) {
        if (!service.active) {
            console.info(`Skipping inactive service: ${service.name}`)
            continue
        }
        const initialize = INITIALIZERS[service.name]
        if (!initialize) {
            console.info(
                `Skipping service without initializer: ${service.name}`,
            )
            continue
        }
        await initialize({ apiClient })
        INITIALIZED_SERVICES.add(service.name)
    }
}
