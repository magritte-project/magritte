import { useMutation } from "@tanstack/react-query"
import { apiClient, toFormData, unwrap } from "../client"
import type { BodySignInSignInPost, UserSignUp } from "../openapi"

export function useSignUp() {
    return useMutation({
        mutationFn: async (body: UserSignUp) => {
            const response = await apiClient.POST("/sign-up", {
                body,
            })
            return unwrap(response)
        },
    })
}

export function useSignIn() {
    return useMutation({
        mutationFn: async (body: BodySignInSignInPost) => {
            const response = await apiClient.POST("/sign-in", {
                body: toFormData(body),
            })
            return unwrap(response)
        },
    })
}
