import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import z from "zod"

import { useSignIn, useSignUp } from "@/api/mutations/root"
import type { UserSignUp } from "@/api/openapi"
import FieldDecoration from "@/components/formComponents/FieldDecoration"
import AppForm from "@/components/reusable/AppForm"
import { useAppForm } from "@/hooks/formHook"
import useToast from "@/hooks/toastHook"
import useUserSession from "@/hooks/userSessionHook"

export const Route = createFileRoute("/sign-up")({
    beforeLoad: async ({ context: { userSession } }) => {
        if (userSession.isSignedIn) {
            throw redirect({ to: "/" })
        }
    },
    component: function SignUpComponent() {
        const navigate = useNavigate()
        const { showToast } = useToast()
        const { signIn } = useUserSession()
        const signUpMutation = useSignUp()
        const signInMutation = useSignIn()
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
                    showToast({ message: `Could not sign up: ${e}`, type: "error" })
                }
            },
        })

        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <AppForm form={form} className="max-w-lg flex flex-col gap-4">
                    <header className="flex items-center gap-2">
                        <img src="/icon.svg" alt="Magritte Logo" className="w-8 h-8" />
                        <span className="font-semibold text-xl">Create An Account</span>
                    </header>
                    <form.AppField
                        name="username"
                        validators={{
                            onSubmit: z.string().min(1, { error: "Username is required" }),
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
