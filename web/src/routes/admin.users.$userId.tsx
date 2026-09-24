import { Field, Label } from "@headlessui/react"
import { OAuth2ScopeSchema, type UserAdminUpdate } from "@magritte/api"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import z from "zod"

import { useUpdateUserAdmin } from "@/api/mutations/users"
import { readUserProfileAdmin, readUserProfile } from "@/api/queries/users"
import ModalHeader from "@/components/chrome/ModalHeader"
import FieldInfo from "@/components/formComponents/FieldInfo"
import AppForm from "@/components/reusable/AppForm"
import Modal from "@/components/reusable/Modal"
import ThemedCheckbox from "@/components/theme/ThemedCheckbox"
import useAPI from "@/hooks/apiHook"
import { useAppForm } from "@/hooks/formHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"
import { getErrorMessage } from "@/utilities/errors"

export const Route = createFileRoute("/admin/users/$userId")({
    loader: async ({ context: { queryClient, api }, params: { userId } }) => {
        await Promise.all([
            queryClient.ensureQueryData(readUserProfileAdmin(api, userId)),
            queryClient.ensureQueryData(readUserProfile(api)),
        ])
    },
    component: function AdminUserEdit() {
        const { userId } = Route.useParams()
        const navigate = Route.useNavigate()

        const api = useAPI()
        const { data: userProfile } = useSuspenseQuery(readUserProfileAdmin(api, userId))
        const { data: myUserProfile } = useSuspenseQuery(readUserProfile(api))

        const updateMutation = useUpdateUserAdmin(Number(userId))
        const notificationCenter = useNotificationCenter()
        const form = useAppForm({
            defaultValues: { ...userProfile } satisfies UserAdminUpdate,
            onSubmit: async ({ value }) => {
                try {
                    await updateMutation.mutateAsync(value)
                    navigate({ to: "..", replace: true })
                } catch (error) {
                    notificationCenter.showToast({
                        message: `Could not update user: ${getErrorMessage(error)}`,
                        type: "error",
                    })
                }
            },
        })

        return (
            <Modal className="w-100">
                <ModalHeader>Edit {userProfile.username}</ModalHeader>

                <AppForm form={form} className="flex flex-col gap-3 p-3">
                    <form.AppField
                        name="preferred_name"
                        validators={{
                            onChange: z.string().max(255, { error: "Name is too long" }).nullable(),
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
                                <Field className="flex items-center gap-between">
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
                                <FieldInfo field={field} />
                            </section>
                        )}
                    </form.Field>

                    <form.Field
                        name="scopes"
                        validators={{
                            onChange: z
                                .array(OAuth2ScopeSchema)
                                .min(1, { error: "Users must have at least one scope set" }),
                        }}
                    >
                        {(field) => (
                            <section className="flex flex-col gap-0.5">
                                <label htmlFor={field.name} className="text-sm font-semibold">
                                    Scopes
                                </label>
                                <ol className="bg-secondary rounded-md p-outside flex flex-col gap-between">
                                    {OAuth2ScopeSchema.options.map((scope) => (
                                        <li key={scope}>
                                            <Field className="flex items-center gap-between">
                                                <ThemedCheckbox
                                                    id={`${field.name}.${scope}`}
                                                    name={`${field.name}.${scope}`}
                                                    checked={field.state.value.includes(scope)}
                                                    onChange={() => {
                                                        field.handleChange((prev) =>
                                                            prev.includes(scope)
                                                                ? prev.filter((s) => s !== scope)
                                                                : [...prev, scope],
                                                        )
                                                    }}
                                                    disabled={
                                                        scope === "profile" ||
                                                        (scope === "admin" &&
                                                            userProfile.id === myUserProfile.id)
                                                    }
                                                />
                                                <Label
                                                    htmlFor={`${field.name}.${scope}`}
                                                    className="text-sm font-semibold"
                                                >
                                                    {scope}
                                                </Label>
                                            </Field>
                                        </li>
                                    ))}
                                </ol>
                                <FieldInfo field={field} />
                            </section>
                        )}
                    </form.Field>

                    <form.SubmitButton className="place-self-center">Save</form.SubmitButton>
                </AppForm>
            </Modal>
        )
    },
})
