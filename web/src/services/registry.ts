import type { APIClient } from "@/api/client"
import { initializeAppleMusic } from "@/services/applemusic/client"
import type { ServiceClientInitializer } from "@/services/client"

const CLIENT_INITIALIZERS: ReadonlyMap<string, ServiceClientInitializer> =
    new Map().set("applemusic", initializeAppleMusic)

export class ServiceRegistry {
    constructor(
        private readonly apiClient: APIClient,
        private readonly availableServiceClients: Set<string> = new Set(),
    ) {
        ;(async () => {
            const services = await this.apiClient.readAvailableServices()
            for (const service of services) {
                if (!service.active) {
                    console.info(`Skipping inactive service ${service.name}`)
                    continue
                }
                const initialize = CLIENT_INITIALIZERS.get(service.name)
                if (!initialize) {
                    console.info(`Skipping inactive service ${service.name}`)
                    continue
                }
                try {
                    await initialize({ apiClient })
                    this.availableServiceClients.add(service.name)
                } catch (error) {
                    console.error(
                        `*** Could not initialize ${service.name}`,
                        error,
                    )
                }
            }
        })()
    }
}
