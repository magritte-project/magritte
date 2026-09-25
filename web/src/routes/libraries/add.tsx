import { Field, Label } from "@headlessui/react"
import {
    PATH_MAX_LENGTH,
    TAG_MAX_LENGTH,
    type ArtworkRead,
    type LibraryCreate,
} from "@magritte/api"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import z from "zod"

import { useCreateLibrary } from "@/api/mutations/libraries"
import { readInstanceStatus } from "@/api/queries/auth"
import ModalHeader from "@/components/chrome/ModalHeader"
import FieldInfo from "@/components/formComponents/FieldInfo"
import AppForm from "@/components/reusable/AppForm"
import LibraryHomeBrowser from "@/components/reusable/LibraryHomeBrowser"
import Modal from "@/components/reusable/Modal"
import ThemedCheckbox from "@/components/theme/ThemedCheckbox"
import useAPI from "@/hooks/apiHook"
import { useAppForm } from "@/hooks/formHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"
import { getErrorMessage } from "@/utilities/errors"

export const Route = createFileRoute("/libraries/add")({
    beforeLoad({
        context: {
            api: { userSessionManager },
        },
    }) {
        if (!userSessionManager.hasScope("library:write")) {
            throw redirect({ to: ".." })
        }
    },
    loader: async ({ context: { api, queryClient } }) => {
        await queryClient.ensureQueryData(readInstanceStatus(api))
    },
    component: function LibrariesCreateComponent() {
        const navigate = useNavigate()
        const api = useAPI()
        const { data: instanceStatus } = useSuspenseQuery(readInstanceStatus(api))
        const createLibraryMutation = useCreateLibrary()
        const notificationCenter = useNotificationCenter()

        const form = useAppForm({
            defaultValues: {
                name: "",
                home_path: null as string | null,
                uploads_enabled: false as boolean,
                cover_artwork: null as ArtworkRead | null,
            } satisfies LibraryCreate,
            onSubmit: async ({ value }) => {
                try {
                    const library = await createLibraryMutation.mutateAsync(value)
                    navigate({
                        to: "/libraries/$libraryId",
                        params: { libraryId: String(library.id) },
                        replace: true,
                    })
                } catch (error) {
                    notificationCenter.showToast({
                        message: `Could not sign in: ${getErrorMessage(error)}`,
                        type: "error",
                    })
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
                            onChange: z
                                .string()
                                .min(1, {
                                    error: "Names must have at least one characters",
                                })
                                .max(TAG_MAX_LENGTH, { error: "Name is too long" }),
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
                                .max(PATH_MAX_LENGTH, { error: "Path is too long" })
                                .nullable(),
                        }}
                        listeners={{
                            onChange: ({ value }) => {
                                if (!value) {
                                    form.setFieldValue("uploads_enabled", false)
                                }
                            },
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

                    <form.Field name="uploads_enabled">
                        {(field) => (
                            <form.Subscribe selector={(state) => !!state.values.home_path}>
                                {(hasHomePath) => (
                                    <Field className="flex items-center gap-2">
                                        <ThemedCheckbox
                                            className="peer"
                                            id={field.name}
                                            name={field.name}
                                            disabled={
                                                !instanceStatus.uploads_enabled || !hasHomePath
                                            }
                                            checked={field.state.value}
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
                            </form.Subscribe>
                        )}
                    </form.Field>

                    <form.SubmitButton className="place-self-center">Add</form.SubmitButton>
                </AppForm>
            </Modal>
        )
    },
})
