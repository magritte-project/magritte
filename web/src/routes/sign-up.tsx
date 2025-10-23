import { useSignIn, useSignUp } from "@/api/mutations/root"
import type { UserSignUp } from "@/api/openapi"
import AppForm from "@/components/AppForm"
import useAPIClient from "@/hooks/apiClientHook"
import { useAppForm } from "@/hooks/formHook"
import useUserSession from "@/hooks/userSessionHook"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"

export const Route = createFileRoute("/sign-up")({
    beforeLoad: async ({ context: { userSession } }) => {
        if (userSession.isSignedIn) {
            throw redirect({ to: "/" })
        }
    },
    component: function SignUpComponent() {
        const navigate = useNavigate()
        const { signIn } = useUserSession()
        const apiClient = useAPIClient()
        const signUpMutation = useSignUp(apiClient)
        const signInMutation = useSignIn(apiClient)
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
            <div className="p-4 text-center">
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
    },
})
