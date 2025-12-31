import { useCreateLibrary } from "@/api/mutations/libraries"
import type { LibraryCreate } from "@/api/openapi"
import ModalHeader from "@/components/chrome/ModalHeader"
import AppForm from "@/components/reusable/AppForm"
import Modal from "@/components/reusable/Modal"
import { useAppForm } from "@/hooks/formHook"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import z from "zod"

export const Route = createFileRoute("/libraries/add")({
    component: function LibrariesCreateComponent() {
        const navigate = useNavigate()
        const createLibraryMutation = useCreateLibrary()
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
            <Modal>
                <ModalHeader>Add Library</ModalHeader>
                <AppForm
                    form={form}
                    className="flex flex-col items-center justify-center gap-2 p-2"
                >
                    <form.AppField
                        name="name"
                        validators={{
                            onChange: z.string().min(1, {
                                error: "Names must have at least one characters",
                            }),
                        }}
                    >
                        {(field) => <field.InputField placeholder="Name" />}
                    </form.AppField>
                    <form.SubmitButton>Add</form.SubmitButton>
                </AppForm>
            </Modal>
        )
    },
})
