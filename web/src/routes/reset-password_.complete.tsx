import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { useResetPasswordComplete } from "@/api/mutations/root"
import FieldDecoration from "@/components/formComponents/FieldDecoration"
import AppForm from "@/components/reusable/AppForm"
import ThemedInput from "@/components/theme/ThemedInput"
import { useAppForm } from "@/hooks/formHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"
import { getErrorMessage } from "@/utilities/errors"

export const Route = createFileRoute("/reset-password_/complete")({
    validateSearch: z.object({
        token: z.string(),
        email: z.email(),
    }),
    component: function CompleteResetPassword() {
        const navigate = Route.useNavigate()
        const { token, email } = Route.useSearch()
        const notificationCenter = useNotificationCenter()
        const completeResetMutation = useResetPasswordComplete()
        const form = useAppForm({
            defaultValues: {
                new_password: "",
            },
            onSubmit: async ({ value }) => {
                try {
                    await completeResetMutation.mutateAsync({ ...value, token, email })
                    navigate({ to: "/sign-in", replace: true })
                } catch (e) {
                    notificationCenter.showToast({
                        message: `Could not reset password: ${getErrorMessage(e)}`,
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
                        <span className="font-semibold text-xl">Reset Password</span>
                    </header>
                    <FieldDecoration label="Email">
                        <ThemedInput
                            type="text"
                            placeholder="Your email address"
                            value={email}
                            disabled={true}
                        />
                    </FieldDecoration>
                    <form.AppField
                        name="new_password"
                        validators={{
                            onChange: z
                                .string()
                                .min(8, { error: "New password is too short" })
                                .max(100, { error: "New password is too long" }),
                        }}
                    >
                        {(field) => (
                            <FieldDecoration field={field} label="New Password">
                                <field.InputField
                                    type="password"
                                    placeholder="Choose a new password"
                                />
                            </FieldDecoration>
                        )}
                    </form.AppField>
                    <form.SubmitButton>Change Password</form.SubmitButton>
                </AppForm>
            </div>
        )
    },
    staticData: {
        wantsFullPageLayout: true,
        noAuth: true,
    },
})
