import { useSignInMutation, useSignUpMutation } from "@/api/hooks/root"
import type { UserSignUp } from "@/api/openapi"
import { retrieveUserSession } from "@/api/userSession"
import AppForm from "@/components/AppForm"
import { useAppForm } from "@/hooks/formHook"
import useUserSession from "@/hooks/userSessionHook"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"

export const Route = createFileRoute("/sign-up")({
    beforeLoad: () => {
        if (retrieveUserSession() !== null) {
            throw redirect({ to: "/" })
        }
    },
    component: SignUpComponent,
})

function SignUpComponent() {
    const navigate = useNavigate()
    const { signIn } = useUserSession()
    const signUpMutation = useSignUpMutation()
    const signInMutation = useSignInMutation()
    const form = useAppForm({
        defaultValues: {
            username: "",
            password: "",
        } satisfies UserSignUp,
        onSubmit: async ({ value }) => {
            try {
                await signUpMutation.mutateAsync(value)
                const token = await signInMutation.mutateAsync({
                    grant_type: "password",
                    username: value.username,
                    password: value.password,
                    scope: "",
                })
                await signIn(token)
                navigate({ to: "/" })
            } catch (e) {
                alert(`Could not sign up: ${e}`)
            }
        },
    })

    return (
        <div className="text-center">
            <AppForm
                form={form}
                className="flex flex-col items-center justify-center gap-2"
            >
                <h1 className="font-bold text-lg">Sign Up</h1>
                <form.AppField name="username">
                    {(field) => <field.InputField placeholder="Username" />}
                </form.AppField>
                <form.AppField name="password">
                    {(field) => (
                        <field.InputField
                            type="password"
                            placeholder="Password"
                        />
                    )}
                </form.AppField>
                <form.SubmitButton />
            </AppForm>
        </div>
    )
}
