import type { BodySignInSignInPost, UserSignUp } from "@magritte/api"
import { useMutation } from "@tanstack/react-query"

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
