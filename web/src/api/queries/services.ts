import { queryOptions } from "@tanstack/react-query"

import type { APIClient } from "@/api/client"

import { isServiceInitialized } from "@/services/initialization"

export function readAvailableServices(apiClient: APIClient) {
    return queryOptions({
        queryKey: ["readAvailableServices"],
        queryFn: async () => {
            const instanceStatus = await apiClient.readInstanceStatus()
            return instanceStatus.available_services.filter((service) =>
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
        enabled: !!query,
    })
}
