import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { useUpdateUserProfile } from "@/api/mutations/users"
import { userProfile } from "@/api/queries/users"
import FieldInfo from "@/components/formComponents/FieldInfo"
import AppForm from "@/components/reusable/AppForm"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import useAPI from "@/hooks/apiHook"
import { useAppForm } from "@/hooks/formHook"
import useToast from "@/hooks/toastHook"
import { getErrorMessage } from "@/utilities/errors"

export const Route = createFileRoute("/user/me/")({
    loader: async ({ context: { queryClient, api } }) => {
        await queryClient.ensureQueryData(userProfile(api))
    },
    component: function UserGeneral() {
        const api = useAPI()
        const { data: me } = useSuspenseQuery(userProfile(api))

        const { showToast } = useToast()
        const updateProfile = useUpdateUserProfile()

        const form = useAppForm({
            defaultValues: me,
            onSubmit: async ({ value }) => {
                try {
                    console.log(value)
                    await updateProfile.mutateAsync(value)
                } catch (error) {
                    showToast({
                        message: `Could not update user: ${getErrorMessage(error)}`,
                        type: "error",
                    })
                }
            },
        })

        return (
            <div className="flex flex-col gap-between">
                <header className="flex items-center gap-between">
                    <h1 className="flex-1 text-2xl font-bold">{me.username}</h1>
                </header>
                <AppForm form={form} className="flex flex-col gap-between">
                    <form.AppField
                        name="preferred_name"
                        validators={{
                            onChange: z
                                .string()
                                .min(1, {
                                    error: "Name is too short",
                                })
                                .nullable(),
                        }}
                    >
                        {(field) => (
                            <section className="flex flex-col gap-0.5">
                                <label htmlFor={field.name} className="text-sm font-semibold">
                                    Preferred Name
                                </label>
                                <field.InputField placeholder="Optional. Shown in place of your username." />
                                <FieldInfo field={field} />
                            </section>
                        )}
                    </form.AppField>

                    <form.Field name="enable_playback_events">
                        {(field) => (
                            <section className="flex flex-col gap-1">
                                <div className="flex items-center gap-between">
                                    <input
                                        type="checkbox"
                                        id={field.name}
                                        name={field.name}
                                        checked={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.currentTarget.checked)
                                        }
                                    />
                                    <label htmlFor={field.name} className="text-sm font-semibold">
                                        Enable Playback Events
                                    </label>
                                </div>
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
