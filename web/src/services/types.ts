import type { JsonStructure } from "react-cmdk"

import type { APIClient } from "@/api/client"

export interface ServiceInitializerContext {
    readonly apiClient: APIClient
}

export type ServiceInitializer = (context: ServiceInitializerContext) => Promise<void>

export type ServiceCommands = () => JsonStructure
