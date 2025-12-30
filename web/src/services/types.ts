import type { APIClient } from "@/api/client"
import type { JsonStructure } from "react-cmdk"

export interface ServiceInitializerContext {
    readonly apiClient: APIClient
}

export type ServiceInitializer = (
    context: ServiceInitializerContext,
) => Promise<void>

export type ServiceCommands = () => JsonStructure
