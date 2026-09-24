import type { API } from "@magritte/api"
import { queryOptions } from "@tanstack/react-query"

import {
    usersAdminProfile,
    userMeFileAccessToken,
    userMeNotification,
    userMeNotifications,
    userMeProfile,
    usersAdminAll,
    usersAll,
} from "@/api/keys/users"

export function readUserProfile(api: API, enabled = true) {
    return queryOptions({
        queryKey: userMeProfile(),
        queryFn: () => api.client.readMe(),
        enabled,
    })
}

export function readNotifications(api: API, offset?: number, limit?: number, enabled = true) {
    return queryOptions({
        queryKey: userMeNotifications(offset, limit),
        queryFn: () => api.client.readNotifications({ offset, limit }),
        enabled,
    })
}

export function readNotification(api: API, notification_id: number, enabled = true) {
    return queryOptions({
        queryKey: userMeNotification(notification_id),
        queryFn: () => api.client.readNotification(notification_id),
        enabled,
    })
}

export function readAllUsers(
    api: API,
    query?: string,
    offset?: number,
    limit?: number,
    enabled = true,
) {
    return queryOptions({
        queryKey: usersAll(query, offset, limit),
        queryFn: () => api.client.readAllUsers({ query, offset, limit }),
        enabled,
    })
}

export function readAllUsersAdmin(
    api: API,
    query?: string,
    offset?: number,
    limit?: number,
    enabled = true,
) {
    return queryOptions({
        queryKey: usersAdminAll(query, offset, limit),
        queryFn: () => api.client.readAllUsersAdmin({ query, offset, limit }),
        enabled,
    })
}

export function readUserProfileAdmin(api: API, idOrUsername: string, enabled = true) {
    return queryOptions({
        queryKey: usersAdminProfile(idOrUsername),
        queryFn: () => api.client.readUserAdmin(idOrUsername),
        enabled,
    })
}

export function fileAccessToken(api: API) {
    return queryOptions({
        queryKey: userMeFileAccessToken(),
        queryFn: () => api.fileAccess.token(),
    })
}
