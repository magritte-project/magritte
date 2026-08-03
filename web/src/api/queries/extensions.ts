import type { APIClient } from "@magritte/api"
import { queryOptions } from "@tanstack/react-query"

import { availableExtensions, installedExtensions } from "@/api/keys/extensions"

export function readAvailableExtensions(client: APIClient, offset?: number, limit?: number) {
    return queryOptions({
        queryKey: availableExtensions(offset, limit),
        queryFn: () => client.readAvailableExtensions(offset, limit),
    })
}

export function readInstalledExtensions(client: APIClient, offset?: number, limit?: number) {
    return queryOptions({
        queryKey: installedExtensions(offset, limit),
        queryFn: () => client.readInstalledExtensions(offset, limit),
    })
}
