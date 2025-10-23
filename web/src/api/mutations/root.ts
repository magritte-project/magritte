import type { APIClient } from "@/api/client"
import type { BodySignInSignInPost, UserSignUp } from "@/api/openapi"
import { useMutation } from "@tanstack/react-query"

export function useSignUp(apiClient: APIClient) {
    return useMutation({
        mutationFn: (body: UserSignUp) => apiClient.signUp(body),
    })
}

export function useSignIn(apiClient: APIClient) {
    return useMutation({
        mutationFn: (body: BodySignInSignInPost) => apiClient.signIn(body),
    })
}
