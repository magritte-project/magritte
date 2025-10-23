import { useSignIn } from "@/api/mutations/root"
import type { BodySignInSignInPost } from "@/api/openapi"
import AppForm from "@/components/AppForm"
import ThemedLink from "@/components/theme/ThemedLink"
import { useAppForm } from "@/hooks/formHook"
import useUserSession from "@/hooks/userSessionHook"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"

export const Route = createFileRoute("/sign-in")({
    beforeLoad: async ({ context: { userSession } }) => {
        if (userSession.isSignedIn) {
            throw redirect({ to: "/" })
        }
    },
    component: function SignInComponent() {
        const navigate = useNavigate()
        const { signIn } = useUserSession()
        const signInMutation = useSignIn()
        const form = useAppForm({
            defaultValues: {
                grant_type: "password",
                username: "",
                password: "",
                scope: "",
            } satisfies BodySignInSignInPost,
            onSubmit: async ({ value }) => {
                try {
                    const token = await signInMutation.mutateAsync(value)
                    await signIn(token)
                    navigate({ to: "/" })
                } catch (e) {
                    alert(`Could not sign in: ${e}`)
                }
            },
        })

        return (
            <div className="p-4 text-center">
                <AppForm
                    form={form}
                    className="flex flex-col items-center justify-center gap-2"
                >
                    <h1 className="font-bold text-lg">Sign In</h1>
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
                    <ThemedLink to="/sign-up">Sign Up</ThemedLink>
                </AppForm>
            </div>
        )
    },
})
