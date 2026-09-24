import type { NotificationUpdate, UserAdminUpdate, UserProfileUpdate } from "@magritte/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
    usersAdminProfile,
    userMeNotification,
    userMeNotifications,
    userMeProfile,
    usersAdminAll,
} from "@/api/keys/users"
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

export function useUpdateUserAdmin(userId: number) {
    const queryClient = useQueryClient()
    const { client } = useAPI()
    return useMutation({
        mutationFn: (body: UserAdminUpdate) => client.updateUserAdmin(userId, body),
        onSuccess: async (data) => {
            await queryClient.invalidateQueries({
                queryKey: usersAdminProfile(data.username),
            })
            await queryClient.invalidateQueries({
                queryKey: usersAdminProfile(String(userId)),
            })
            await queryClient.invalidateQueries({
                queryKey: usersAdminAll(),
                exact: false,
            })
        },
    })
}

export function useDeleteUserAdmin(userId: number) {
    const queryClient = useQueryClient()
    const { client } = useAPI()
    return useMutation({
        mutationFn: () => client.deleteUserAdmin(userId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: usersAdminAll(),
                exact: false,
            })
        },
    })
}
