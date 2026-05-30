import { PlusIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import { useCallback } from "react"
import { z } from "zod"

import { useDeleteExtension } from "@/api/mutations/extensions"
import { readAvailableExtensions } from "@/api/queries/extensions"
import PermissionInfo from "@/components/extensions/PermissionInfo"
import AsyncButton from "@/components/reusable/AsyncButton"
import ConfirmDialog from "@/components/reusable/ConfirmDialog"
import TableFooter from "@/components/reusable/TableFooter"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import ThemedLink from "@/components/theme/ThemedLink"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useAPIClient from "@/hooks/apiClientHook"
import usePresentation from "@/hooks/presentationHook"
import useToast from "@/hooks/toastHook"
import { getErrorMessage } from "@/utilities/errors"

export const Route = createFileRoute("/admin/extensions")({
    validateSearch: z.object({ offset: z.number().optional(), limit: z.number().optional() }),
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({
        context: { queryClient, apiClient },
        deps: {
            search: { offset, limit },
        },
    }) => {
        await queryClient.ensureQueryData(readAvailableExtensions(apiClient, offset, limit))
    },
    component: function AdminExtensions() {
        const { offset, limit } = Route.useSearch()
        const navigate = Route.useNavigate()
        const apiClient = useAPIClient()
        const { data: availableExtensions } = useSuspenseQuery(
            readAvailableExtensions(apiClient, offset, limit),
        )

        const { isPresented, dismiss, present } = usePresentation<boolean>()
        const { showToast } = useToast()
        const deleteMutation = useDeleteExtension()
        const handleDeleteClick = useCallback(
            async (extensionId: number) => {
                const confirmed = await present()
                if (!confirmed) {
                    return
                }
                try {
                    await deleteMutation.mutateAsync(extensionId)
                } catch (error) {
                    showToast({
                        message: `Could not delete extension: ${getErrorMessage(error)}`,
                        type: "error",
                    })
                }
            },
            [present, deleteMutation, showToast],
        )

        return (
            <div className="flex flex-col gap-3">
                <header className="flex items-center gap-3">
                    <h1 className="flex-1 text-2xl font-bold">Available Extensions</h1>
                    <ThemedLink to="/admin/extensions/import">
                        <PlusIcon aria-label="Import" />
                    </ThemedLink>
                </header>
                <ol>
                    {availableExtensions.items.map((extension) => (
                        <li
                            key={`extension-${extension.id}`}
                            className="py-1 bg-gray-50 odd:bg-inherit flex items-center gap-2"
                        >
                            <div className="flex-1 flex flex-col">
                                <span className="font-bold pb-0.5">{extension.manifest.name}</span>
                                <span className="text-sm text-gray-500 pb-1">
                                    {extension.manifest.description}
                                </span>
                                <span className="text-xs text-gray-300 pb-1.5">
                                    {extension.manifest.url}
                                </span>
                                <span className="flex items-center flex-wrap gap-1">
                                    {extension.manifest.permissions?.map((permission) => (
                                        <PermissionInfo
                                            key={permission}
                                            permission={permission}
                                            compact
                                        />
                                    ))}
                                </span>
                            </div>
                            <ThemedSubtleButton
                                buttonComponent={AsyncButton}
                                onClick={() => handleDeleteClick(extension.id)}
                            >
                                <TrashIcon aria-label="Delete" />
                            </ThemedSubtleButton>
                        </li>
                    ))}
                </ol>
                <TableFooter
                    className="self-center"
                    singularLabel="Extension"
                    pluralLabel="Extensions"
                    offset={availableExtensions.offset}
                    limit={availableExtensions.limit}
                    total={availableExtensions.total}
                    onChange={(offset, _limit) =>
                        navigate({
                            search: (oldSearch) => ({
                                ...oldSearch,
                                offset,
                            }),
                        })
                    }
                />
                <Outlet />
                <ConfirmDialog
                    isPresented={isPresented}
                    dismiss={dismiss}
                    title="Are you sure you want to delete this extension?"
                    message="It will be uninstalled for all users on this instance. This cannot be undone."
                    cancel="Cancel"
                    confirm="Delete"
                />
            </div>
        )
    },
    pendingComponent() {
        return <ThemedContentUnavailable className="h-auto!" />
    },
    errorComponent({ error, reset }) {
        return <ThemedContentUnavailable className="h-auto!" error={error} onRetry={reset} />
    },
})
