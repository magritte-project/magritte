import type { LibraryIgnoredResourceRead } from "@magritte/api"
import { getErrorMessage } from "@magritte/rpc"
import { TrashIcon } from "@phosphor-icons/react/dist/ssr"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useCallback } from "react"
import { z } from "zod"

import { useDeleteLibraryIgnoredResource } from "@/api/mutations/libraries"
import { readLibraryIgnoredResources } from "@/api/queries/libraries"
import TableFooter from "@/components/reusable/TableFooter"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useAPI from "@/hooks/apiHook"
import useNotificationCenter from "@/hooks/notificationCenterHook"

export const Route = createFileRoute("/libraries/manage/$libraryId/ignored")({
    validateSearch: z.object({
        offset: z.number().optional(),
    }),
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({
        context: { queryClient, api },
        params: { libraryId },
        deps: {
            search: { offset = 0 },
        },
    }) => {
        await queryClient.query({
            ...readLibraryIgnoredResources(api, Number(libraryId), { offset }),
            staleTime: "static",
        })
    },
    component: function ManageLibraryIgnoredResources() {
        const navigate = Route.useNavigate()
        const { libraryId } = Route.useParams()
        const { offset = 0 } = Route.useSearch()
        const notificationCenter = useNotificationCenter()
        const api = useAPI()
        const { data: ignoredResources } = useSuspenseQuery(
            readLibraryIgnoredResources(api, Number(libraryId), { offset }),
        )

        const deleteMutation = useDeleteLibraryIgnoredResource(Number(libraryId))
        const deleteIgnoredResource = useCallback(
            async (ignoredResource: LibraryIgnoredResourceRead) => {
                try {
                    await deleteMutation.mutateAsync(ignoredResource.id)
                } catch (error) {
                    notificationCenter.showToast({
                        message: `Could not remove ignored resource: ${getErrorMessage(error)}`,
                        type: "error",
                    })
                }
            },
            [deleteMutation, notificationCenter],
        )

        return (
            <div className="p-xl flex flex-col gap-md">
                <ol className="flex flex-col gap-md">
                    {ignoredResources.items.map((ignoredResource) => (
                        <li key={ignoredResource.id} className="flex items-center gap-lg">
                            <div className="flex-1 text-sm font-mono">
                                <div className="truncate max-w-120">{ignoredResource.url}</div>
                            </div>
                            <ThemedSubtleButton
                                type="button"
                                title="Remove"
                                onClick={() => deleteIgnoredResource(ignoredResource)}
                                disabled={deleteMutation.isPending}
                            >
                                <TrashIcon />
                            </ThemedSubtleButton>
                        </li>
                    ))}
                </ol>
                <TableFooter
                    className="self-center"
                    singularLabel="Ignored Resource"
                    pluralLabel="Ignored Resources"
                    offset={ignoredResources.offset}
                    limit={ignoredResources.limit}
                    total={ignoredResources.total}
                    onChange={(offset, _limit) =>
                        navigate({
                            search: (oldSearch) => ({
                                ...oldSearch,
                                offset,
                            }),
                        })
                    }
                />
            </div>
        )
    },
})
