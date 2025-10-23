import { updateMe } from "@/api/client"
import type { UserProfileUpdate } from "@/api/openapi"
import { userProfile } from "@/api/queries/users"
import { type QueryClient, useMutation } from "@tanstack/react-query"

export function useUpdateUserProfile(queryClient: QueryClient) {
    return useMutation({
        mutationFn: async (data: UserProfileUpdate) => {
            const response = await updateMe(data)
            await queryClient.invalidateQueries(userProfile())
            return response
        },
    })
}
