import type { APIClient, FileAccess } from "@magritte/api"
import { queryOptions } from "@tanstack/react-query"

import {
    userMeFileAccessToken,
    userMeNotification,
    userMeNotifications,
    userMeProfile,
    usersAll,
} from "@/api/keys/users"

export function userProfile(client: APIClient, enabled = true) {
    return queryOptions({
        queryKey: userMeProfile(),
        queryFn: () => client.readMe(),
        enabled,
    })
}

export function readNotifications(
    client: APIClient,
    offset?: number,
    limit?: number,
    enabled = true,
) {
    return queryOptions({
        queryKey: userMeNotifications(offset, limit),
        queryFn: () => client.readNotifications(offset, limit),
        enabled,
    })
}

export function readNotification(client: APIClient, notification_id: number, enabled = true) {
    return queryOptions({
        queryKey: userMeNotification(notification_id),
        queryFn: () => client.readNotification(notification_id),
        enabled,
    })
}

export function readAllUsers(
    client: APIClient,
    query?: string,
    offset?: number,
    limit?: number,
    enabled = true,
) {
    return queryOptions({
        queryKey: usersAll(query, offset, limit),
        queryFn: () => client.readAllUsers(query, offset, limit),
        enabled,
    })
}

export function fileAccessToken(fileAccess: FileAccess) {
    return queryOptions({
        queryKey: userMeFileAccessToken(),
        queryFn: () => fileAccess.token(),
    })
}
