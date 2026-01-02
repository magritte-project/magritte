import { useMutation } from "@tanstack/react-query"

import type { BodySignInSignInPost, UserSignUp } from "@/api/openapi"

import useAPIClient from "@/hooks/apiClientHook"

export function useSignUp() {
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: UserSignUp) => apiClient.signUp(body),
    })
}

export function useSignIn() {
    const apiClient = useAPIClient()
    return useMutation({
        mutationFn: (body: BodySignInSignInPost) => apiClient.signIn(body),
    })
}
