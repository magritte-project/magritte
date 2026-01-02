import { queryOptions } from "@tanstack/react-query"

import type { APIClient } from "@/api/client"

export function userProfile(apiClient: APIClient, enabled = true) {
    return queryOptions({
        queryKey: ["readMe"],
        queryFn: () => apiClient.readMe(),
        enabled,
    })
}
