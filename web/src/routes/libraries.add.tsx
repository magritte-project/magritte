import { createFileRoute, useNavigate } from "@tanstack/react-router"
import z from "zod"

import type { LibraryCreate } from "@/api/openapi"

import { useCreateLibrary } from "@/api/mutations/libraries"
import ModalHeader from "@/components/chrome/ModalHeader"
import FieldInfo from "@/components/formComponents/FieldInfo"
import AppForm from "@/components/reusable/AppForm"
import LibraryHomeBrowser from "@/components/reusable/LibraryHomeBrowser"
import Modal from "@/components/reusable/Modal"
import { useAppForm } from "@/hooks/formHook"

export const Route = createFileRoute("/libraries/add")({
    component: function LibrariesCreateComponent() {
        const navigate = useNavigate()
        const createLibraryMutation = useCreateLibrary()

        const form = useAppForm({
            defaultValues: {
                name: "",
                home_path: null as string | null,
            } satisfies LibraryCreate,
            onSubmit: async ({ value }) => {
                try {
                    const library = await createLibraryMutation.mutateAsync(value)
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
            <Modal className="w-72">
                <ModalHeader>Add Library</ModalHeader>
                <AppForm form={form} className="flex flex-col gap-3 p-3">
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

                    <form.Field
                        name="home_path"
                        validators={{
                            onChange: z
                                .string()
                                .startsWith(".", { error: "Must be relative path" })
                                .nullable(),
                        }}
                    >
                        {(field) => (
                            <>
                                <h2 className="font-bold">Will the library have files?</h2>
                                <fieldset className="flex flex-col gap-1 text-sm">
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="radio"
                                            id="home_path-streaming_only"
                                            checked={field.state.value === null}
                                            onChange={() => {
                                                field.handleChange(null)
                                            }}
                                        />
                                        <label htmlFor="home_path-streaming_only">
                                            No, it will only have streaming content
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <input
                                            type="radio"
                                            id="home_path-has_files"
                                            checked={field.state.value !== null}
                                            onClick={() => {
                                                if (field.state.value === null) {
                                                    field.handleChange(".")
                                                }
                                            }}
                                        />
                                        <label htmlFor="home_path-has_files">
                                            Yes,{" "}
                                            {field.state.value === null
                                                ? "I will choose where"
                                                : "it has files here"}
                                        </label>
                                    </div>
                                </fieldset>
                                {field.state.value !== null && (
                                    <LibraryHomeBrowser
                                        relativeTo={field.state.value}
                                        onNavigateTo={field.handleChange}
                                    />
                                )}
                                <FieldInfo field={field} />
                            </>
                        )}
                    </form.Field>

                    <form.SubmitButton className="place-self-center">Add</form.SubmitButton>
                </AppForm>
            </Modal>
        )
    },
})
