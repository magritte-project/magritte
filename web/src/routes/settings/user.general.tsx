import { Field, Label } from "@headlessui/react"
import { getErrorMessage } from "@magritte/rpc"
import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { useUpdateUserProfile } from "@/api/mutations/users"
import { readUserProfile } from "@/api/queries/users"
import FieldInfo from "@/components/formComponents/FieldInfo"
import AppForm from "@/components/reusable/AppForm"
import ThemedCheckbox from "@/components/theme/ThemedCheckbox"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import useAPI from "@/hooks/apiHook"
import { useAppForm } from "@/hooks/formHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"

export const Route = createFileRoute("/settings/user/general")({
    loader: async ({ context: { queryClient, api } }) => {
        await queryClient.query({ ...readUserProfile(api), staleTime: "static" })
    },
    component: function UserGeneral() {
        const api = useAPI()
        const { data: me } = useSuspenseQuery(readUserProfile(api))

        const notificationCenter = useNotificationCenter()
        const updateProfile = useUpdateUserProfile()

        const form = useAppForm({
            defaultValues: me,
            onSubmit: async ({ value }) => {
                try {
                    await updateProfile.mutateAsync(value)
                } catch (error) {
                    notificationCenter.showToast({
                        message: `Could not update user: ${getErrorMessage(error)}`,
                        type: "error",
                    })
                }
            },
        })

        return (
            <div className="flex flex-col gap-lg">
                <header className="flex items-center gap-lg">
                    <h1 className="flex-1 text-2xl font-bold">{me.username}</h1>
                </header>
                <AppForm form={form} className="flex flex-col gap-lg">
                    <form.AppField
                        name="preferred_name"
                        validators={{
                            onChange: z.string().max(255, { error: "Name is too long" }).nullable(),
                        }}
                    >
                        {(field) => (
                            <section className="flex flex-col gap-xs">
                                <label htmlFor={field.name} className="text-sm font-semibold">
                                    Preferred Name
                                </label>
                                <field.InputField placeholder="Optional. Shown in place of your username." />
                                <FieldInfo field={field} />
                            </section>
                        )}
                    </form.AppField>

                    <form.AppField
                        name="email"
                        validators={{
                            onChange: z.email().nullable(),
                        }}
                    >
                        {(field) => (
                            <section className="flex flex-col gap-xs">
                                <label htmlFor={field.name} className="text-sm font-semibold">
                                    Email
                                </label>
                                <field.InputField placeholder={me.email ?? "None set"} />
                                {me.email !== null &&
                                    (me.is_email_verified ? (
                                        <div className="text-sm flex items-center gap-sm">
                                            <CheckCircleIcon /> Verified
                                        </div>
                                    ) : (
                                        <div className="text-sm flex items-center gap-sm">
                                            <XCircleIcon /> Unverified
                                        </div>
                                    ))}
                                <FieldInfo field={field} />
                            </section>
                        )}
                    </form.AppField>

                    <form.Field name="enable_playback_events">
                        {(field) => (
                            <section className="flex flex-col gap-sm">
                                <Field className="flex items-center gap-lg">
                                    <ThemedCheckbox
                                        id={field.name}
                                        name={field.name}
                                        checked={field.state.value}
                                        onChange={field.handleChange}
                                    />
                                    <Label htmlFor={field.name} className="text-sm font-semibold">
                                        Enable Playback Events
                                    </Label>
                                </Field>
                                <div className="text-xs text-on-secondary">
                                    Recording playback events enables Magritte to generate reports
                                    about your listening habits. Examples of playback events include
                                    starting a song, pausing it, and seeking around. Magritte never
                                    directly shares this data with anyone else.
                                </div>
                                <FieldInfo field={field} />
                            </section>
                        )}
                    </form.Field>

                    <form.SubmitButton className="place-self-center">Save</form.SubmitButton>
                </AppForm>
            </div>
        )
    },
    pendingComponent() {
        return <ThemedContentUnavailable className="h-auto!" />
    },
    errorComponent({ error, reset }) {
        return <ThemedContentUnavailable className="h-auto!" error={error} onRetry={reset} />
    },
})
