import { Field, Label } from "@headlessui/react"
import { OAuth2ScopeSchema, type UserAdminUpdate } from "@magritte/api"
import { TrashIcon } from "@phosphor-icons/react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useCallback } from "react"
import z from "zod"

import { useDeleteUserAdmin, useUpdateUserAdmin } from "@/api/mutations/users"
import { readUserProfile, readUserProfileAdmin } from "@/api/queries/users"
import ModalHeader from "@/components/chrome/ModalHeader"
import FieldInfo from "@/components/formComponents/FieldInfo"
import AppForm from "@/components/reusable/AppForm"
import AsyncButton from "@/components/reusable/AsyncButton"
import Modal from "@/components/reusable/Modal"
import ThemedCheckbox from "@/components/theme/ThemedCheckbox"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useAPI from "@/hooks/apiHook"
import { useAppForm } from "@/hooks/formHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"
import { getErrorMessage } from "@/utilities/errors"

export const Route = createFileRoute("/settings/admin/users/$userId")({
    loader: async ({ context: { queryClient, api }, params: { userId } }) => {
        await Promise.all([
            queryClient.query({ ...readUserProfileAdmin(api, userId), staleTime: "static" }),
            queryClient.query({ ...readUserProfile(api), staleTime: "static" }),
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

        const deleteMutation = useDeleteUserAdmin(Number(userId))
        const handleDelete = useCallback(async () => {
            const confirmed = await notificationCenter.confirm({
                title: `Are you sure you want to delete ${userProfile.username}?`,
                message:
                    "This will also delete any library content not shared with other users. This operation cannot be undone.",
                destructive: true,
                confirmButtonLabel: `Delete ${userProfile.username}`,
            })
            if (!confirmed) {
                return
            }
            try {
                await deleteMutation.mutateAsync()
                navigate({ to: "..", replace: true })
            } catch (error) {
                notificationCenter.showToast({
                    message: `Could not delete user: ${getErrorMessage(error)}`,
                    type: "error",
                })
            }
        }, [notificationCenter, userProfile.username, deleteMutation, navigate])

        return (
            <Modal className="w-100">
                <ModalHeader
                    supplementaryEnd={
                        <ThemedSubtleButton
                            buttonComponent={AsyncButton}
                            type="button"
                            title={`Delete ${userProfile.username}`}
                            onClick={handleDelete}
                            disabled={userProfile.id === myUserProfile.id}
                        >
                            <TrashIcon />
                        </ThemedSubtleButton>
                    }
                >
                    Edit {userProfile.username}
                </ModalHeader>

                <AppForm form={form} className="flex flex-col gap-lg p-3">
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

                    <form.Field
                        name="scopes"
                        validators={{
                            onChange: z
                                .array(OAuth2ScopeSchema)
                                .min(1, { error: "Users must have at least one scope set" }),
                        }}
                    >
                        {(field) => (
                            <section className="flex flex-col gap-xs">
                                <label htmlFor={field.name} className="text-sm font-semibold">
                                    Scopes
                                </label>
                                <ol className="bg-secondary rounded-list-element p-lg flex flex-col gap-lg">
                                    {OAuth2ScopeSchema.options.map((scope) => (
                                        <li key={scope}>
                                            <Field className="flex items-center gap-lg">
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
