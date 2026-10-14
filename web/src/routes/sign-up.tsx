import type { SignUp } from "@magritte/api"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import z from "zod"

import { useSignIn, useSignUp } from "@/api/mutations/root"
import { readInstanceStatus } from "@/api/queries/auth"
import FieldDecoration from "@/components/formComponents/FieldDecoration"
import AppForm from "@/components/reusable/AppForm"
import useAPI from "@/hooks/apiHook"
import { useAppForm } from "@/hooks/formHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"
import useUserSession from "@/hooks/userSessionHook"
import { getErrorMessage } from "@/utilities/errors"

export const Route = createFileRoute("/sign-up")({
    beforeLoad: async ({
        context: {
            api: { userSessionManager },
        },
    }) => {
        if (userSessionManager.isSignedIn) {
            throw redirect({ to: "/" })
        }
    },
    loader: async ({ context: { api, queryClient } }) => {
        await queryClient.query({ ...readInstanceStatus(api), staleTime: "static" })
    },
    component: function SignUpComponent() {
        const navigate = useNavigate()
        const notificationCenter = useNotificationCenter()
        const { signIn } = useUserSession()

        const api = useAPI()
        const { data: instanceStatus } = useSuspenseQuery(readInstanceStatus(api))

        const signUpMutation = useSignUp()
        const signInMutation = useSignIn()
        const form = useAppForm({
            defaultValues: {
                email: null,
                username: "",
                password: "",
            } satisfies SignUp as SignUp,
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
                    notificationCenter.showToast({
                        message: `Could not sign up: ${getErrorMessage(e)}`,
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
                        <span className="font-semibold text-xl">Create An Account</span>
                    </header>
                    {instanceStatus.email_enabled && (
                        <form.AppField
                            name="email"
                            validators={{
                                onSubmit: z.email({ error: "Valid email is required" }).nullish(),
                            }}
                        >
                            {(field) => (
                                <FieldDecoration field={field} label="Email">
                                    <field.InputField placeholder="Enter your email" />
                                </FieldDecoration>
                            )}
                        </form.AppField>
                    )}
                    <form.AppField
                        name="username"
                        validators={{
                            onSubmit: z
                                .string()
                                .min(1, { error: "Username is required" })
                                .max(255, { error: "Username is too long" }),
                        }}
                    >
                        {(field) => (
                            <FieldDecoration field={field} label="Username">
                                <field.InputField placeholder="Choose a username" />
                            </FieldDecoration>
                        )}
                    </form.AppField>
                    <form.AppField
                        name="password"
                        validators={{
                            onChange: z
                                .string()
                                .min(8, { error: "Password is too short" })
                                .max(100, { error: "Password is too long" }),
                        }}
                    >
                        {(field) => (
                            <FieldDecoration field={field} label="Password">
                                <field.InputField type="password" placeholder="Choose a password" />
                            </FieldDecoration>
                        )}
                    </form.AppField>
                    <form.SubmitButton>Sign Up</form.SubmitButton>
                </AppForm>
            </div>
        )
    },
    staticData: {
        wantsFullPageLayout: true,
        noAuth: true,
    },
})
