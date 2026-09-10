import { URL_MAX_LENGTH, type ExtensionImportAdmin } from "@magritte/api"
import { isSameOrigin } from "@magritte/sdk"
import { createFileRoute } from "@tanstack/react-router"
import z from "zod"

import { useImportExtension } from "@/api/mutations/extensions"
import ModalHeader from "@/components/chrome/ModalHeader"
import FieldInfo from "@/components/formComponents/FieldInfo"
import AppForm from "@/components/reusable/AppForm"
import Modal from "@/components/reusable/Modal"
import { useAppForm } from "@/hooks/formHook"

export const Route = createFileRoute("/admin/extensions/import")({
    component: function AdminExtensionsImport() {
        const navigate = Route.useNavigate()
        const importMutation = useImportExtension()
        const form = useAppForm({
            defaultValues: {
                manifest_url: "",
            } satisfies ExtensionImportAdmin,
            onSubmit: async ({ value }) => {
                try {
                    const manifest_url = !value.manifest_url.endsWith("/extension.magritte.json")
                        ? `${value.manifest_url}/extension.magritte.json`
                        : value.manifest_url
                    await importMutation.mutateAsync({ manifest_url })
                    navigate({
                        to: "/admin/extensions",
                    })
                } catch (e) {
                    alert(`Could not import extension: ${e}`)
                }
            },
        })

        return (
            <Modal className="w-100">
                <ModalHeader>Import Extension</ModalHeader>
                <AppForm form={form} className="flex flex-col gap-3 p-3">
                    <form.AppField
                        name="manifest_url"
                        validators={{
                            onChange: z
                                .string()
                                .min(1, {
                                    error: "Extension URL is required",
                                })
                                .max(URL_MAX_LENGTH, { error: "Extension URL is too long" })
                                .and(
                                    z
                                        .string()
                                        .refine(
                                            (arg) =>
                                                !arg || !isSameOrigin(arg, window.location.origin),
                                            {
                                                error: "Extension cannot have same origin as host app",
                                            },
                                        ),
                                ),
                        }}
                    >
                        {(field) => (
                            <>
                                <field.InputField placeholder="http://localhost:1234/extension.magritte.json" />
                                <FieldInfo field={field} />
                            </>
                        )}
                    </form.AppField>

                    <form.SubmitButton className="place-self-center">Import</form.SubmitButton>
                </AppForm>
            </Modal>
        )
    },
})
