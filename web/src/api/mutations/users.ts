import type { APIClient } from "@/api/client"
import type { UserProfileUpdate } from "@/api/openapi"
import { userProfile } from "@/api/queries/users"
import { type QueryClient, useMutation } from "@tanstack/react-query"

export function useUpdateUserProfile(
    apiClient: APIClient,
    queryClient: QueryClient,
) {
    return useMutation({
        mutationFn: async (data: UserProfileUpdate) => {
            const response = await apiClient.updateMe(data)
            await queryClient.invalidateQueries(userProfile(apiClient))
            return response
        },
    })
}
