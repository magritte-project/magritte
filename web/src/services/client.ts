import type { APIClient } from "@/api/client"

export interface ServiceClientContext {
    readonly apiClient: APIClient
}

export type ServiceClientInitializer = (
    context: ServiceClientContext,
) => Promise<void>
