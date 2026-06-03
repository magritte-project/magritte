import type { LibraryUpdate } from "@magritte/api"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { useUpdateLibrary } from "@/api/mutations/libraries"
import { readLibrary } from "@/api/queries/libraries"
import FieldDecoration from "@/components/formComponents/FieldDecoration"
import AppForm from "@/components/reusable/AppForm"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import useAPIClient from "@/hooks/apiClientHook"
import { useAppForm } from "@/hooks/formHook"
import useToast from "@/hooks/toastHook"
import { getErrorMessage } from "@/utilities/errors"

export const Route = createFileRoute("/libraries/manage/$libraryId/")({
    component: function ManageLibraryGeneral() {
        const { libraryId } = Route.useParams()
        const { showToast } = useToast()
        const apiClient = useAPIClient()
        const { data: library } = useSuspenseQuery(readLibrary(apiClient, Number(libraryId)))

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
                    showToast({
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
