import type { LibraryUpdate } from "@magritte/api"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { useUpdateLibrary } from "@/api/mutations/libraries"
import { readInstanceStatus } from "@/api/queries/auth"
import { readLibrary } from "@/api/queries/libraries"
import FieldDecoration from "@/components/formComponents/FieldDecoration"
import AppForm from "@/components/reusable/AppForm"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import useAPI from "@/hooks/apiHook"
import { useAppForm } from "@/hooks/formHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"
import { getErrorMessage } from "@/utilities/errors"

export const Route = createFileRoute("/libraries/manage/$libraryId/")({
    loader: async ({ context: { api, queryClient } }) => {
        await queryClient.ensureQueryData(readInstanceStatus(api))
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
            <AppForm form={form} className="p-4 flex flex-col gap-4">
                <form.AppField name="name" validators={{}}>
                    {(field) => (
                        <FieldDecoration field={field} label="Library Name">
                            <field.InputField placeholder="Name" />
                        </FieldDecoration>
                    )}
                </form.AppField>

                <form.Field name="uploads_enabled">
                    {(field) => (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="peer"
                                id={field.name}
                                name={field.name}
                                disabled={!instanceStatus.uploads_enabled || !library.home_path}
                                checked={field.state.value ?? false}
                                onChange={(e) => field.handleChange(e.currentTarget.checked)}
                                onBlur={field.handleBlur}
                            />
                            <label
                                htmlFor={field.name}
                                className="text-sm peer-disabled:opacity-70"
                            >
                                Allow File Uploads
                            </label>
                        </div>
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
