import type { APIClient } from "@/api/client"
import { queryOptions } from "@tanstack/react-query"

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
