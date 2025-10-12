import { type QueryClient, useMutation, useQuery } from "@tanstack/react-query"
import { readMe, updateMe } from "../client"
import type { UserProfileUpdate } from "../openapi"

export function useUserProfileQuery(enabled = true) {
    return useQuery({
        queryKey: ["/users/me"],
        queryFn: () => readMe(),
        enabled,
    })
}

export function updateUserProfileMutation(queryClient: QueryClient) {
    return useMutation({
        mutationFn: async (data: UserProfileUpdate) => {
            const response = await updateMe(data)
            await queryClient.invalidateQueries(useUserProfileQuery())
            return response
        },
    })
}
