import { signIn, signUp } from "@/api/client"
import { useMutation } from "@tanstack/react-query"

export function useSignUpMutation() {
    return useMutation({
        mutationFn: signUp,
    })
}

export function useSignInMutation() {
    return useMutation({
        mutationFn: signIn,
    })
}
