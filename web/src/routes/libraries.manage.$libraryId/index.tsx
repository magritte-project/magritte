import { Field, Label } from "@headlessui/react"
import { TAG_MAX_LENGTH, type LibraryUpdate } from "@magritte/api"
import { getErrorMessage } from "@magritte/rpc"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { useUpdateLibrary } from "@/api/mutations/libraries"
import { readInstanceStatus } from "@/api/queries/auth"
import { readLibrary } from "@/api/queries/libraries"
import FieldDecoration from "@/components/formComponents/FieldDecoration"
import AppForm from "@/components/reusable/AppForm"
import ThemedCheckbox from "@/components/theme/ThemedCheckbox"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import useAPI from "@/hooks/apiHook"
import { useAppForm } from "@/hooks/formHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"

export const Route = createFileRoute("/libraries/manage/$libraryId/")({
    loader: async ({ context: { api, queryClient } }) => {
        await queryClient.query({ ...readInstanceStatus(api), staleTime: "static" })
    },
    component: function ManageLibraryGeneral() {
        const { libraryId } = Route.useParams()
        const notificationCenter = useNotificationCenter()
        const api = useAPI()
        const { data: library } = useSuspenseQuery(readLibrary(api, Number(libraryId)))
        const { data: instanceStatus } = useSuspenseQuery(readInstanceStatus(api))

        const updateMutation = useUpdateLibrary(Number(libraryId))
        const form = useAppForm({
            defaultValues: {
                ...library,
            } satisfies LibraryUpdate as LibraryUpdate,
            onSubmit: async ({ value, formApi }) => {
                try {
                    await updateMutation.mutateAsync(value)
                    formApi.reset()
                } catch (error) {
                    notificationCenter.showToast({
                        message: `Failed to update library: ${getErrorMessage(error)}`,
                        type: "error",
                    })
                }
            },
        })
        return (
            <AppForm form={form} className="p-xl flex flex-col gap-xl">
                <form.AppField
                    name="name"
                    validators={{
                        onChange: z
                            .string()
                            .min(1, { error: "Name is too short" })
                            .max(TAG_MAX_LENGTH, { error: "Name is too long" }),
                    }}
                >
                    {(field) => (
                        <FieldDecoration field={field} label="Library Name">
                            <field.InputField placeholder="Name" />
                        </FieldDecoration>
                    )}
                </form.AppField>

                <form.AppField name="cover_artwork">
                    {(field) => (
                        <FieldDecoration field={field} label="Library Cover Artwork">
                            <field.ArtworkSearchField libraryId={library.id} />
                        </FieldDecoration>
                    )}
                </form.AppField>

                <form.Field name="uploads_enabled">
                    {(field) => (
                        <Field className="flex items-center gap-md">
                            <ThemedCheckbox
                                className="peer"
                                id={field.name}
                                name={field.name}
                                disabled={!instanceStatus.uploads_enabled || !library.home_path}
                                checked={field.state.value ?? false}
                                onChange={field.handleChange}
                                onBlur={field.handleBlur}
                            />
                            <Label
                                htmlFor={field.name}
                                className="text-sm font-semibold peer-aria-disabled:opacity-disabled"
                            >
                                Allow File Uploads
                            </Label>
                        </Field>
                    )}
                </form.Field>

                <form.SubmitButton>Save</form.SubmitButton>
            </AppForm>
        )
    },
    pendingComponent() {
        return <ThemedContentUnavailable className="h-auto!" />
    },
    errorComponent({ error, reset }) {
        return <ThemedContentUnavailable className="h-auto!" error={error} onRetry={reset} />
    },
})
