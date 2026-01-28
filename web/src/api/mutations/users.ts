import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { NotificationUpdate, UserProfileUpdate } from "@/api/openapi"

import { userMeNotification, userMeNotifications, userMeProfile } from "@/api/keys/users"
import useAPIClient from "@/hooks/apiClientHook"

export function useUpdateUserProfile() {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (data: UserProfileUpdate) => apiClient.updateMe(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: userMeProfile() })
        },
    })
}

export function useUpdateNotification(notification_id: number) {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: NotificationUpdate) =>
            apiClient.updateNotification(notification_id, body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: userMeNotifications(),
                exact: false,
            })
            await queryClient.invalidateQueries({ queryKey: userMeNotification(notification_id) })
        },
    })
}

export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: () => apiClient.markAllNotificationsRead(),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: userMeNotifications(),
                exact: false,
            })
        },
    })
}
