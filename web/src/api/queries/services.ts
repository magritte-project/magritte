import { queryOptions } from "@tanstack/react-query"
import type { APIClient } from "@/api/client"
import type { ServiceKind } from "@/api/openapi"

export function searchService(
    apiClient: APIClient,
    name: string | undefined,
    query: string,
    kind?: ServiceKind[],
    offset?: number,
    limit?: number,
) {
    return queryOptions({
        queryKey: ["searchService", name, query, kind, offset, limit],
        queryFn: async () => {
            if (!name || !query) {
                return {
                    results: [],
                    offset: offset ?? 0,
                    limit: limit ?? 25,
                }
            } else {
                return await apiClient.searchService(
                    name,
                    query,
                    kind,
                    offset,
                    limit,
                )
            }
        },
    })
}
