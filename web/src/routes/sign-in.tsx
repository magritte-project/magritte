import type { BodySignInSignInPost } from "@magritte/api"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import z from "zod"

import { useSignIn } from "@/api/mutations/root"
import { readInstanceStatus } from "@/api/queries/auth"
import FieldDecoration from "@/components/formComponents/FieldDecoration"
import AppForm from "@/components/reusable/AppForm"
import ThemedLink from "@/components/theme/ThemedLink"
import useAPI from "@/hooks/apiHook"
import { useAppForm } from "@/hooks/formHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"
import useUserSession from "@/hooks/userSessionHook"

export const Route = createFileRoute("/sign-in")({
    validateSearch: z.object({ redirect_to: z.string().optional() }),
    beforeLoad: async ({
        context: {
            api: { userSessionManager },
        },
        search: { redirect_to: redirectTo = "/" },
    }) => {
        if (userSessionManager.isSignedIn) {
            throw redirect({ href: redirectTo })
        }
    },
    loader: async ({ context: { api, queryClient } }) => {
        await queryClient.query({ ...readInstanceStatus(api), staleTime: "static" })
    },
    component: function SignInComponent() {
        const navigate = Route.useNavigate()
        const { redirect_to: redirectTo = "/" } = Route.useSearch()
        const notificationCenter = useNotificationCenter()
        const { signIn } = useUserSession()

        const api = useAPI()
        const { data: instanceStatus } = useSuspenseQuery(readInstanceStatus(api))

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
                    navigate({ href: redirectTo })
                } catch (e) {
                    notificationCenter.showToast({
                        message: `Could not sign in: ${e}`,
                        type: "error",
                    })
                }
            },
        })

        return (
            <div className="min-h-screen flex items-center justify-center p-xl">
                <AppForm form={form} className="min-w-0 w-100 flex flex-col gap-xl">
                    <header className="flex items-center gap-md">
                        <img src="/icon.svg" alt="Magritte Logo" className="w-8 h-8" />
                        <span className="font-semibold text-xl">Sign In</span>
                    </header>
                    <form.AppField
                        name="username"
                        validators={{
                            onSubmit: z.string().min(1, {
                                error: instanceStatus.email_enabled
                                    ? "Username email is required"
                                    : "Username is required",
                            }),
                        }}
                    >
                        {(field) => (
                            <FieldDecoration
                                field={field}
                                label={
                                    instanceStatus.email_enabled ? "Username or email" : "Username"
                                }
                            >
                                <field.InputField
                                    placeholder={
                                        instanceStatus.email_enabled
                                            ? "Enter your username or email"
                                            : "Enter your username"
                                    }
                                />
                            </FieldDecoration>
                        )}
                    </form.AppField>
                    <form.AppField
                        name="password"
                        validators={{
                            onSubmit: z
                                .string()
                                .min(8, { error: "Password is too short" })
                                .max(100, { error: "Password is too long" }),
                        }}
                    >
                        {(field) => (
                            <FieldDecoration field={field} label="Password">
                                <field.InputField
                                    type="password"
                                    placeholder="Enter your password"
                                />
                            </FieldDecoration>
                        )}
                    </form.AppField>
                    <form.SubmitButton>Sign In</form.SubmitButton>
                    <span className="self-center text-center">
                        Don't have an account? <ThemedLink to="/sign-up">Sign up</ThemedLink>
                    </span>
                </AppForm>
            </div>
        )
    },
    staticData: {
        wantsFullPageLayout: true,
        noAuth: true,
    },
})
