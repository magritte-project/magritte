import type { BodySignInSignInPost, UserSignUp } from "@magritte/api"
import { useMutation } from "@tanstack/react-query"

import useAPI from "@/hooks/apiHook"

export function useSignUp() {
    const { client } = useAPI()
    return useMutation({
        mutationFn: (body: UserSignUp) => client.signUp(body),
    })
}

export function useSignIn() {
    const { client } = useAPI()
    return useMutation({
        mutationFn: (body: BodySignInSignInPost) => client.signIn(body),
    })
}
