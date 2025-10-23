import type { APIClient } from "@/api/client"
import { queryOptions } from "@tanstack/react-query"

export function userProfile(apiClient: APIClient, enabled = true) {
    return queryOptions({
        queryKey: ["readMe"],
        queryFn: () => apiClient.readMe(),
        enabled,
    })
}
