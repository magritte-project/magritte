import type { APIClient } from "@/api/client"
import { queryOptions } from "@tanstack/react-query"

export function searchServiceSongs(
    apiClient: APIClient,
    name: string | undefined,
    query: string,
    offset?: number,
    limit?: number,
) {
    return queryOptions({
        queryKey: ["searchServiceSongs", name, query, offset, limit],
        queryFn: async () => {
            if (!name || !query) {
                return {
                    items: [],
                    offset: offset ?? 0,
                    limit: limit ?? 25,
                }
            } else {
                return await apiClient.searchServiceSongs(
                    name,
                    query,
                    offset,
                    limit,
                )
            }
        },
    })
}
