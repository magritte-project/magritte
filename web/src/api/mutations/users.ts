import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { UserProfileUpdate } from "@/api/openapi"

import { userProfile } from "@/api/queries/users"
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
