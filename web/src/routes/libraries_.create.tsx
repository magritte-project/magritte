import { useCreateLibraryMutation } from "@/api/hooks/libraries"
import type { LibraryCreate } from "@/api/openapi"
import AppForm from "@/components/AppForm"
import { useAppForm } from "@/hooks/formHook"
import { createFileRoute, useNavigate } from "@tanstack/react-router"

export const Route = createFileRoute("/libraries_/create")({
    component: function LibrariesCreateComponent() {
        const navigate = useNavigate()
        const createLibraryMutation = useCreateLibraryMutation()
        const form = useAppForm({
            defaultValues: {
                name: "",
            } satisfies LibraryCreate,
            onSubmit: async ({ value }) => {
                try {
                    const library =
                        await createLibraryMutation.mutateAsync(value)
                    navigate({
                        to: "/libraries/$libraryId",
                        params: { libraryId: String(library.id) },
                    })
                } catch (e) {
                    alert(`Could not sign in: ${e}`)
                }
            },
        })
        return (
            <div className="flex flex-col text-center items-center justify-center gap-2 p-4 min-h-0 h-screen">
                <AppForm
                    form={form}
                    className="flex flex-col items-center justify-center gap-2"
                >
                    <h1 className="font-bold text-lg">Create Library</h1>
                    <form.AppField name="name">
                        {(field) => <field.InputField placeholder="Name" />}
                    </form.AppField>
                    <form.SubmitButton />
                </AppForm>
            </div>
        )
    },
})
