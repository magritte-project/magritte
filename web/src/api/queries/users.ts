import { queryOptions } from "@tanstack/react-query"

import type { APIClient } from "@/api/client"

export function userProfile(apiClient: APIClient, enabled = true) {
    return queryOptions({
        queryKey: ["readMe"],
        queryFn: () => apiClient.readMe(),
        enabled,
    })
}

export function readNotifications(
    apiClient: APIClient,
    offset?: number,
    limit?: number,
    enabled = true,
) {
    return queryOptions({
        queryKey: ["readNotifications", offset, limit],
        queryFn: () => apiClient.readNotifications(offset, limit),
        enabled,
    })
}

export function readNotification(apiClient: APIClient, notification_id: number, enabled = true) {
    return queryOptions({
        queryKey: ["readNotification", notification_id],
        queryFn: () => apiClient.readNotification(notification_id),
        enabled,
    })
}
