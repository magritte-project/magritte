import type { API } from "@magritte/api"
import { queryOptions } from "@tanstack/react-query"

import { instanceStatus } from "@/api/keys/auth"

export function readInstanceStatus(api: API) {
    return queryOptions({
        queryKey: instanceStatus(),
        queryFn: () => api.client.instanceStatus(),
    })
}
