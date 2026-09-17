import type { API } from "@magritte/api"
import { queryOptions } from "@tanstack/react-query"

import { availableExtensions, installedExtensions } from "@/api/keys/extensions"

export function readAvailableExtensions(api: API, offset?: number, limit?: number) {
    return queryOptions({
        queryKey: availableExtensions(offset, limit),
        queryFn: () => api.client.readAvailableExtensions({ offset, limit }),
    })
}

export function readInstalledExtensions(api: API, offset?: number, limit?: number) {
    return queryOptions({
        queryKey: installedExtensions(offset, limit),
        queryFn: () => api.client.readInstalledExtensions({ offset, limit }),
    })
}
