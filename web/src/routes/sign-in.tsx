import type { BodySignInSignInPost } from "@magritte/api"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import z from "zod"

import { useSignIn } from "@/api/mutations/root"
import FieldDecoration from "@/components/formComponents/FieldDecoration"
import AppForm from "@/components/reusable/AppForm"
import ThemedLink from "@/components/theme/ThemedLink"
import { useAppForm } from "@/hooks/formHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"
import useUserSession from "@/hooks/userSessionHook"

export const Route = createFileRoute("/sign-in")({
    beforeLoad: async ({
        context: {
            api: { userSessionManager },
        },
    }) => {
        if (userSessionManager.isSignedIn) {
            throw redirect({ to: "/" })
        }
    },
    component: function SignInComponent() {
        const navigate = useNavigate()
        const notificationCenter = useNotificationCenter()
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
                    notificationCenter.showToast({
                        message: `Could not sign in: ${e}`,
                        type: "error",
                    })
                }
            },
        })

        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <AppForm form={form} className="w-full max-w-sm flex flex-col gap-4">
                    <header className="flex items-center gap-2">
                        <img src="/icon.svg" alt="Magritte Logo" className="w-8 h-8" />
                        <span className="font-semibold text-xl">Sign In</span>
                    </header>
                    <form.AppField
                        name="username"
                        validators={{
                            onSubmit: z.string().min(1, { error: "Username is required" }),
                        }}
                    >
                        {(field) => (
                            <FieldDecoration field={field} label="Username">
                                <field.InputField placeholder="Enter your username" />
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
