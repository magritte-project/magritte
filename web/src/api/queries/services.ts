import type { APIClient } from "@/api/client"
import { isServiceInitialized } from "@/services/initialization"
import { queryOptions } from "@tanstack/react-query"

export function readAvailableServices(apiClient: APIClient) {
    return queryOptions({
        queryKey: ["readAvailableServices"],
        queryFn: async () => {
            const allAvailableServices = await apiClient.readAvailableServices()
            return allAvailableServices.filter((service) =>
                isServiceInitialized(service.name),
            )
        },
    })
}

export function searchServiceSongs(
    apiClient: APIClient,
    name: string,
    query: string,
    offset?: number,
    limit?: number,
) {
    return queryOptions({
        queryKey: ["searchServiceSongs", name, query, offset, limit],
        queryFn: () => apiClient.searchServiceSongs(name, query, offset, limit),
    })
}
