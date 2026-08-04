import { PlusIcon } from "@phosphor-icons/react"
import { TrashIcon } from "@phosphor-icons/react/dist/ssr"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import { useCallback, useMemo } from "react"
import z from "zod"

import { useUninstallExtension } from "@/api/mutations/extensions"
import { readInstalledExtensions } from "@/api/queries/extensions"
import ModalHeader from "@/components/chrome/ModalHeader"
import ExtensionIcon from "@/components/extensions/ExtensionIcon"
import PermissionInfo from "@/components/extensions/PermissionInfo"
import AsyncButton from "@/components/reusable/AsyncButton"
import ConfirmDialog from "@/components/reusable/ConfirmDialog"
import Modal from "@/components/reusable/Modal"
import TableFooter from "@/components/reusable/TableFooter"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import ThemedLink from "@/components/theme/ThemedLink"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useAPI from "@/hooks/apiHook"
import usePresentation from "@/hooks/presentationHook"
import useToast from "@/hooks/toastHook"
import { getErrorMessage } from "@/utilities/errors"

export const Route = createFileRoute("/user/me/extensions")({
    validateSearch: z.object({ offset: z.number().optional(), limit: z.number().optional() }),
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({
        context: { queryClient, api },
        deps: {
            search: { offset, limit },
        },
    }) => {
        await queryClient.ensureQueryData(readInstalledExtensions(api, offset, limit))
    },
    component: function AdminExtensions() {
        const { offset, limit } = Route.useSearch()
        const navigate = Route.useNavigate()
        const api = useAPI()
        const { data: installedExtensions } = useSuspenseQuery(
            readInstalledExtensions(api, offset, limit),
        )

        const {
            isPresented: isExtensionPresented,
            input: presentedExtensionId,
            dismiss: dismissPresentedExtension,
            present: presentExtension,
        } = usePresentation<void, number>()
        const presentedExtension = useMemo(
            () =>
                installedExtensions.items.find(
                    (extension) => extension.id === presentedExtensionId,
                ),
            [installedExtensions, presentedExtensionId],
        )

        const {
            isPresented: isConfirmUninstallPresented,
            dismiss: dismissConfirmUninstall,
            present: presentConfirmUninstall,
        } = usePresentation<boolean>()
        const { showToast } = useToast()
        const uninstallMutation = useUninstallExtension()
        const handleUninstallClick = useCallback(async () => {
            if (presentedExtensionId === undefined) {
                return
            }
            const confirmed = await presentConfirmUninstall()
            if (!confirmed) {
                return
            }
            try {
                await uninstallMutation.mutateAsync(presentedExtensionId)
            } catch (error) {
                showToast({
                    message: `Could not uninstall extension: ${getErrorMessage(error)}`,
                    type: "error",
                })
            }
        }, [presentedExtensionId, presentConfirmUninstall, uninstallMutation, showToast])

        return (
            <div className="flex flex-col gap-3">
                <header className="flex items-center gap-3">
                    <h1 className="flex-1 text-2xl font-bold">Installed Extensions</h1>
                    <ThemedLink to="/user/me/extensions/add">
                        <PlusIcon aria-label="Add" />
                    </ThemedLink>
                </header>
                <ol className="flex items-start content-start flex-wrap gap-2">
                    {installedExtensions.items.map((extension) => (
                        <li key={`extensions[${extension.id}]`}>
                            <button
                                type="button"
                                className="flex flex-col items-center justify-center gap-2 p-2 w-24 h-24 rounded-md hover:bg-gray-50 active:bg-gray-100"
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
                    offset={installedExtensions.offset}
                    limit={installedExtensions.limit}
                    total={installedExtensions.total}
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
                                onClick={handleUninstallClick}
                                title="Uninstall"
                            >
                                <TrashIcon />
                            </ThemedSubtleButton>
                        }
                    >
                        About Extension
                    </ModalHeader>
                    <div className="flex flex-col items-center gap-3 p-3">
                        <ExtensionIcon
                            iconUrl={presentedExtension?.manifest.icon_url}
                            name={presentedExtension?.manifest.name ?? ""}
                            size="3rem"
                        />
                        <div className="font-medium text-center">
                            {presentedExtension?.manifest.name}
                        </div>
                        <span className="text-sm text-center text-gray-500">
                            {presentedExtension?.manifest.description}
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
                <ConfirmDialog
                    isPresented={isConfirmUninstallPresented}
                    dismiss={dismissConfirmUninstall}
                    title="Are you sure you want to uninstall this extension?"
                    message="You may reinstall this extension later as long as it remains available on this instance."
                    cancel="Cancel"
                    confirm="Uninstall"
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
