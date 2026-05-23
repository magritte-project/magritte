import { PlusIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import { z } from "zod"

import { useDeleteExtension } from "@/api/mutations/extensions"
import { readAvailableExtensions } from "@/api/queries/extensions"
import TableFooter from "@/components/reusable/TableFooter"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import ThemedLink from "@/components/theme/ThemedLink"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useAPIClient from "@/hooks/apiClientHook"

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
        const deleteMutation = useDeleteExtension()

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
                            <div className="flex-1 flex flex-col gap-0.5">
                                <span className="font-bold">{extension.manifest.name}</span>
                                <span className="text-sm text-gray-500">
                                    {extension.manifest.description}
                                </span>
                                <span className="text-xs text-gray-300">
                                    {extension.manifest.url}
                                </span>
                            </div>
                            <ThemedSubtleButton
                                onClick={() => deleteMutation.mutateAsync(extension.id)}
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
