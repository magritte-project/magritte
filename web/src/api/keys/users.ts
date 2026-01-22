export function users() {
    return ["users"] as const
}

export function me() {
    return [...users(), "me"] as const
}

export function userMeProfile() {
    return [...me(), "profile"] as const
}

export function userMeNotifications<Rest extends any[]>(...rest: Rest) {
    return [...me(), "notifications", ...rest] as const
}

export function userMeNotification(notification_id: number) {
    return [...userMeNotifications(), notification_id] as const
}
