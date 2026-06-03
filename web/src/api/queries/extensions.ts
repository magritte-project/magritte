import type { APIClient } from "@magritte/api"
import { queryOptions } from "@tanstack/react-query"

import { availableExtensions, installedExtensions } from "@/api/keys/extensions"

export function readAvailableExtensions(apiClient: APIClient, offset?: number, limit?: number) {
    return queryOptions({
        queryKey: availableExtensions(offset, limit),
        queryFn: () => apiClient.readAvailableExtensions(offset, limit),
    })
}

export function readInstalledExtensions(apiClient: APIClient, offset?: number, limit?: number) {
    return queryOptions({
        queryKey: installedExtensions(offset, limit),
        queryFn: () => apiClient.readInstalledExtensions(offset, limit),
    })
}
