import type { NotificationUpdate, UserProfileUpdate } from "@magritte/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { userMeNotification, userMeNotifications, userMeProfile } from "@/api/keys/users"
import useAPI from "@/hooks/apiHook"

export function useUpdateUserProfile() {
    const queryClient = useQueryClient()
    const { client } = useAPI()
    return useMutation({
        mutationFn: (data: UserProfileUpdate) => client.updateMe(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: userMeProfile() })
        },
    })
}

export function useUpdateNotification(notification_id: number) {
    const queryClient = useQueryClient()
    const { client } = useAPI()
    return useMutation({
        mutationFn: (body: NotificationUpdate) => client.updateNotification(notification_id, body),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: userMeNotifications(),
                exact: false,
            })
            await queryClient.invalidateQueries({ queryKey: userMeNotification(notification_id) })
        },
    })
}

export function useDeleteNotification(notification_id: number) {
    const queryClient = useQueryClient()
    const { client } = useAPI()
    return useMutation({
        mutationFn: () => client.deleteNotification(notification_id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: userMeNotifications(),
                exact: false,
            })
        },
    })
}

export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient()
    const { client } = useAPI()
    return useMutation({
        mutationFn: () => client.markAllNotificationsRead(),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: userMeNotifications(),
                exact: false,
            })
        },
    })
}
