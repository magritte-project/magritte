import { PlusIcon } from "@phosphor-icons/react"
import { CaretDownIcon, CaretRightIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import classNames from "classnames"
import { useCallback, useState } from "react"
import z from "zod"

import { useUninstallExtension } from "@/api/mutations/extensions"
import { readInstalledExtensions } from "@/api/queries/extensions"
import ExtensionIcon from "@/components/extensions/ExtensionIcon"
import PermissionInfo from "@/components/extensions/PermissionInfo"
import AsyncButton from "@/components/reusable/AsyncButton"
import ConfirmDialog from "@/components/reusable/ConfirmDialog"
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

        const [expandedExtension, setExpandedExtension] = useState<number | null>(null)

        const { isPresented, dismiss, present } = usePresentation<boolean>()
        const { showToast } = useToast()
        const uninstallMutation = useUninstallExtension()
        const handleUninstallClick = useCallback(
            async (extensionId: number) => {
                const confirmed = await present()
                if (!confirmed) {
                    return
                }
                try {
                    await uninstallMutation.mutateAsync(extensionId)
                } catch (error) {
                    showToast({
                        message: `Could not uninstall extension: ${getErrorMessage(error)}`,
                        type: "error",
                    })
                }
            },
            [present, uninstallMutation, showToast],
        )

        return (
            <div className="flex flex-col gap-3">
                <header className="flex items-center gap-3">
                    <h1 className="flex-1 text-2xl font-bold">Installed Extensions</h1>
                    <ThemedLink to="/user/me/extensions/add">
                        <PlusIcon aria-label="Add" />
                    </ThemedLink>
                </header>
                <ol>
                    {installedExtensions.items.map((extension) => (
                        <li
                            key={`extension-${extension.id}`}
                            className="py-1 bg-gray-50 odd:bg-inherit flex items-center gap-2"
                        >
                            <div className="flex-1 flex items-start gap-2">
                                <ExtensionIcon
                                    iconUrl={extension.manifest.icon_url}
                                    name={extension.manifest.name}
                                />
                                <div className="flex flex-col">
                                    <span className="font-bold pb-0.5">
                                        {extension.manifest.name}
                                    </span>
                                    <span className="text-sm text-gray-500 pb-2">
                                        {extension.manifest.description}
                                    </span>
                                    <div className="text-left flex items-start gap-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setExpandedExtension((prev) =>
                                                    prev === extension.id ? null : extension.id,
                                                )
                                            }
                                        >
                                            <span className="py-1">
                                                {expandedExtension === extension.id ? (
                                                    <CaretDownIcon />
                                                ) : (
                                                    <CaretRightIcon />
                                                )}
                                            </span>
                                        </button>
                                        <span
                                            className={classNames("flex", {
                                                "flex-col items-start gap-2":
                                                    expandedExtension === extension.id,
                                                "flex-row items-center flex-wrap gap-1":
                                                    expandedExtension !== extension.id,
                                            })}
                                        >
                                            {extension.manifest.permissions?.map((permission) => (
                                                <PermissionInfo
                                                    key={permission}
                                                    permission={permission}
                                                    compact={expandedExtension !== extension.id}
                                                />
                                            ))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <ThemedSubtleButton
                                buttonComponent={AsyncButton}
                                onClick={() => handleUninstallClick(extension.id)}
                            >
                                <TrashIcon aria-label="Uninstall" />
                            </ThemedSubtleButton>
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
                <ConfirmDialog
                    isPresented={isPresented}
                    dismiss={dismiss}
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
