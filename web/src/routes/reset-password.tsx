import type { ResetPassword } from "@magritte/api"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { useResetPassword } from "@/api/mutations/root"
import FieldDecoration from "@/components/formComponents/FieldDecoration"
import AppForm from "@/components/reusable/AppForm"
import { useAppForm } from "@/hooks/formHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"

export const Route = createFileRoute("/reset-password")({
    component: function ResetPassword() {
        const notificationCenter = useNotificationCenter()
        const resetMutation = useResetPassword()
        const form = useAppForm({
            defaultValues: {
                email: "",
            } satisfies ResetPassword,
            onSubmit: async ({ value }) => {
                try {
                    await resetMutation.mutateAsync(value)
                } catch (e) {
                    notificationCenter.showToast({
                        message: `Could not request reset password: ${e}`,
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
                        <span className="font-semibold text-xl">Request Reset Password</span>
                    </header>
                    <form.AppField
                        name="email"
                        validators={{
                            onSubmit: z.email({ error: "Valid email is required" }),
                        }}
                    >
                        {(field) => (
                            <FieldDecoration field={field} label="Email">
                                <field.InputField placeholder="Enter your email" />
                            </FieldDecoration>
                        )}
                    </form.AppField>
                    <form.SubmitButton>Reset Password</form.SubmitButton>
                </AppForm>
            </div>
        )
    },
    staticData: {
        wantsFullPageLayout: true,
        noAuth: true,
    },
})
