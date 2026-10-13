import type {
    BodySignInSignInPost,
    CompleteResetPassword,
    ResetPassword,
    SignUp,
} from "@magritte/api"
import { useMutation } from "@tanstack/react-query"

import useAPI from "@/hooks/apiHook"

export function useSignUp() {
    const { client } = useAPI()
    return useMutation({
        mutationFn: (body: SignUp) => client.signUp(body),
    })
}

export function useSignIn() {
    const { client } = useAPI()
    return useMutation({
        mutationFn: (body: BodySignInSignInPost) => client.signIn(body),
    })
}

export function useResetPassword() {
    const { client } = useAPI()
    return useMutation({
        mutationFn: (body: ResetPassword) => client.resetPassword(body),
    })
}

export function useResetPasswordComplete() {
    const { client } = useAPI()
    return useMutation({
        mutationFn: (body: CompleteResetPassword) => client.resetPasswordComplete(body),
    })
}
