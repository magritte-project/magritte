import { ArrowSquareInIcon } from "@phosphor-icons/react"
import { TrashIcon } from "@phosphor-icons/react/dist/ssr"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import { useCallback, useMemo } from "react"
import { z } from "zod"

import { useDeleteExtension } from "@/api/mutations/extensions"
import { readAvailableExtensions } from "@/api/queries/extensions"
import ModalHeader from "@/components/chrome/ModalHeader"
import ExtensionIcon from "@/components/extensions/ExtensionIcon"
import PermissionInfo from "@/components/extensions/PermissionInfo"
import AsyncButton from "@/components/reusable/AsyncButton"
import Modal from "@/components/reusable/Modal"
import TableFooter from "@/components/reusable/TableFooter"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import ThemedLink from "@/components/theme/ThemedLink"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useAPI from "@/hooks/apiHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"
import usePresentation from "@/hooks/presentationHook"
import { getErrorMessage } from "@/utilities/errors"

export const Route = createFileRoute("/admin/extensions")({
    validateSearch: z.object({ offset: z.number().optional(), limit: z.number().optional() }),
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({
        context: { queryClient, api },
        deps: {
            search: { offset, limit },
        },
    }) => {
        await queryClient.ensureQueryData(readAvailableExtensions(api, offset, limit))
    },
    component: function AdminExtensions() {
        const { offset, limit } = Route.useSearch()
        const navigate = Route.useNavigate()
        const api = useAPI()
        const { data: availableExtensions } = useSuspenseQuery(
            readAvailableExtensions(api, offset, limit),
        )

        const notificationCenter = useNotificationCenter()

        const {
            isPresented: isExtensionPresented,
            input: presentedExtensionId,
            dismiss: dismissPresentedExtension,
            present: presentExtension,
        } = usePresentation<void, number>()
        const presentedExtension = useMemo(
            () =>
                availableExtensions.items.find(
                    (extension) => extension.id === presentedExtensionId,
                ),
            [availableExtensions, presentedExtensionId],
        )

        const deleteMutation = useDeleteExtension()
        const handleDeleteClick = useCallback(async () => {
            if (presentedExtensionId === undefined) {
                return
            }
            const confirmed = await notificationCenter.confirm({
                title: "Are you sure you want to delete this extension?",
                message:
                    "It will be uninstalled for all users on this instance. This cannot be undone.",
                confirmButtonLabel: "Delete",
                destructive: true,
            })
            if (!confirmed) {
                return
            }
            dismissPresentedExtension()
            try {
                await deleteMutation.mutateAsync(presentedExtensionId)
            } catch (error) {
                notificationCenter.showToast({
                    message: `Could not delete extension: ${getErrorMessage(error)}`,
                    type: "error",
                })
            }
        }, [presentedExtensionId, notificationCenter, dismissPresentedExtension, deleteMutation])

        return (
            <div className="flex flex-col gap-3">
                <header className="flex items-center gap-3">
                    <h1 className="flex-1 text-2xl font-bold">Available Extensions</h1>
                    <ThemedLink to="/admin/extensions/import" title="Import Extension">
                        <ArrowSquareInIcon size="1.2rem" weight="bold" />
                    </ThemedLink>
                </header>
                <ol className="flex items-start content-start flex-wrap gap-2">
                    {availableExtensions.items.map((extension) => (
                        <li key={`extensions[${extension.id}]`}>
                            <button
                                type="button"
                                className="flex flex-col items-center justify-center gap-2 p-2 w-24 h-24 rounded-md hover:bg-secondary active:bg-secondary-active"
                                onClick={() => presentExtension(extension.id)}
                            >
                                <ExtensionIcon
                                    iconUrl={extension.manifest.icon_url}
                                    name={extension.manifest.name}
                                    size="3rem"
                                />
                                <span
                                    className="line-clamp-1 text-sm font-medium"
                                    title={extension.manifest.name}
                                >
                                    {extension.manifest.name}
                                </span>
                            </button>
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
                <Modal
                    isPresented={isExtensionPresented}
                    onDismiss={dismissPresentedExtension}
                    className="w-72"
                >
                    <ModalHeader
                        supplementaryEnd={
                            <ThemedSubtleButton
                                buttonComponent={AsyncButton}
                                onClick={handleDeleteClick}
                                title="Delete"
                            >
                                <TrashIcon />
                            </ThemedSubtleButton>
                        }
                    >
                        About Extension
                    </ModalHeader>
                    <div className="flex flex-col items-center gap-between p-outside">
                        <ExtensionIcon
                            iconUrl={presentedExtension?.manifest.icon_url}
                            name={presentedExtension?.manifest.name ?? ""}
                            size="3rem"
                        />
                        <div className="font-medium text-center">
                            {presentedExtension?.manifest.name}
                        </div>
                        <span className="text-sm text-center text-on-secondary">
                            {presentedExtension?.manifest.description}
                        </span>
                        <span className="text-xs text-center text-on-tertiary">
                            {presentedExtension?.manifest.url}
                        </span>
                        <span className="flex flex-col items-start gap-2 text-xs">
                            {presentedExtension?.manifest.permissions?.map((permission) => (
                                <PermissionInfo
                                    key={permission}
                                    permission={permission}
                                    compact={false}
                                />
                            ))}
                        </span>
                    </div>
                </Modal>
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
