import { signIn, signUp } from "@/api/client"
import { useMutation } from "@tanstack/react-query"

export function useSignUp() {
    return useMutation({
        mutationFn: signUp,
    })
}

export function useSignIn() {
    return useMutation({
        mutationFn: signIn,
    })
}
