import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { NotificationUpdate, UserProfileUpdate } from "@/api/openapi"

import { readNotification, readNotifications, userProfile } from "@/api/queries/users"
import useAPIClient from "@/hooks/apiClientHook"

export function useUpdateUserProfile() {
    const queryClient = useQueryClient()
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (data: UserProfileUpdate) => apiClient.updateMe(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries(userProfile(apiClient))
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
                queryKey: readNotifications(apiClient).queryKey.slice(0, 1),
            })
            await queryClient.invalidateQueries(readNotification(apiClient, notification_id))
        },
    })
}
