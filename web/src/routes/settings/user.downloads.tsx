import { getErrorMessage } from "@magritte/rpc"
import { FileIcon, TrashIcon } from "@phosphor-icons/react"
import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import classNames from "classnames"
import { filesize } from "filesize"
import { useEffect } from "react"

import ThemedLargeTitleSubheader from "@/components/theme/ThemedLargeTitleSubheader"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useLocalCache from "@/hooks/localCacheHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"

export const Route = createFileRoute("/settings/user/downloads")({
    component: function UserCache() {
        const localCache = useLocalCache()
        const notificationCenter = useNotificationCenter()

        const { data: storageEstimate, refetch: refetchStorageEstimate } = useSuspenseQuery({
            queryKey: ["localCache", "storageEstimate"],
            queryFn: () => navigator.storage.estimate(),
        })
        const { data: sourceFileUrls, refetch: refetchSourceFileUrls } = useSuspenseQuery({
            queryKey: ["localCache", "getAllSourceFileUrls"],
            queryFn: () => localCache.store.getAllSourceFileUrls(),
        })

        useEffect(() => {
            return localCache.store.subscribe(() => {
                void refetchStorageEstimate()
                void refetchSourceFileUrls()
            })
        }, [localCache, refetchStorageEstimate, refetchSourceFileUrls])

        const deleteMutation = useMutation({
            mutationFn: async (url: string) => {
                const confirmed = await notificationCenter.confirm({
                    title: `Are you sure you want to delete the downloaded copy of <${url}>?`,
                    message:
                        "It will no longer be available offline. It can be redownloaded again in the future.",
                    destructive: true,
                    confirmButtonLabel: "Delete",
                })
                if (!confirmed) {
                    return
                }
                await localCache.store.deleteSourceFile(url)
            },
            onError: (error) => {
                notificationCenter.showToast({
                    type: "error",
                    message: `Could not delete downloaded copy: ${getErrorMessage(error)}`,
                })
            },
        })

        return (
            <div className="flex flex-col gap-lg">
                <ThemedLargeTitleSubheader
                    caption={
                        storageEstimate.quota !== undefined && (
                            <div>
                                {filesize(storageEstimate.usage ?? 0)} of{" "}
                                {filesize(storageEstimate.quota)} used
                            </div>
                        )
                    }
                >
                    Downloads
                </ThemedLargeTitleSubheader>
                <ol className="flex flex-col">
                    {sourceFileUrls.map((url) => (
                        <li
                            key={`sourceFileUrls[${url}`}
                            className={classNames(
                                "bg-secondary odd:bg-inherit hover:bg-key-subtle rounded-li",
                                "flex items-center gap-md",
                                "px-md py-1 h-9",
                            )}
                        >
                            <FileIcon />
                            <span className="flex-1">{url}</span>
                            <ThemedSubtleButton
                                type="button"
                                title="Delete"
                                onClick={() => deleteMutation.mutate(url)}
                                disabled={deleteMutation.isPending}
                            >
                                <TrashIcon />
                            </ThemedSubtleButton>
                        </li>
                    ))}
                </ol>
            </div>
        )
    },
})
