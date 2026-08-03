import { PlusIcon } from "@phosphor-icons/react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { useInstallExtension } from "@/api/mutations/extensions"
import { readAvailableExtensions } from "@/api/queries/extensions"
import ModalHeader from "@/components/chrome/ModalHeader"
import AsyncButton from "@/components/reusable/AsyncButton"
import Modal from "@/components/reusable/Modal"
import TableFooter from "@/components/reusable/TableFooter"
import useAPI from "@/hooks/apiHook"

export const Route = createFileRoute("/user/me/extensions/add")({
    validateSearch: z.object({ offset: z.number().optional(), limit: z.number().optional() }),
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({
        context: {
            queryClient,
            api: { client },
        },
        deps: {
            search: { offset, limit },
        },
    }) => {
        await queryClient.ensureQueryData(readAvailableExtensions(client, offset, limit))
    },
    component: function AdminExtensionsImport() {
        const { offset, limit } = Route.useSearch()
        const navigate = Route.useNavigate()
        const { client } = useAPI()
        const { data: availableExtensions } = useSuspenseQuery(
            readAvailableExtensions(client, offset, limit),
        )
        const installMutation = useInstallExtension()

        return (
            <Modal className="w-72">
                <ModalHeader>Available Extensions</ModalHeader>
                <div className="flex flex-col gap-3 p-4">
                    <ol>
                        {availableExtensions.items.map((extension) => (
                            <li
                                key={`extension-${extension.id}`}
                                className="bg-gray-50 odd:bg-inherit"
                            >
                                <AsyncButton
                                    className="py-1 w-full text-left flex items-center gap-2"
                                    onClick={async () => {
                                        await installMutation.mutateAsync(extension.id)
                                        navigate({
                                            to: "/user/me/extensions",
                                        })
                                    }}
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
                                    <PlusIcon aria-label="Install" />
                                </AsyncButton>
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
                </div>
            </Modal>
        )
    },
})
