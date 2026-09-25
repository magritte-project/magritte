import { CaretRightIcon } from "@phosphor-icons/react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, Outlet } from "@tanstack/react-router"
import z from "zod"

import { readAllUsersAdmin } from "@/api/queries/users"
import TableFooter from "@/components/reusable/TableFooter"
import useAPI from "@/hooks/apiHook"

export const Route = createFileRoute("/settings/admin/users")({
    validateSearch: z.object({ offset: z.number().optional(), query: z.string().optional() }),
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({
        context: { queryClient, api },
        deps: {
            search: { offset, query },
        },
    }) => {
        await queryClient.ensureQueryData(readAllUsersAdmin(api, query, offset))
    },
    component: function AdminUsers() {
        const { query, offset } = Route.useSearch()
        const navigate = Route.useNavigate()
        const api = useAPI()
        const { data: allUsers } = useSuspenseQuery(readAllUsersAdmin(api, query, offset))
        return (
            <div className="flex flex-col gap-3">
                <header className="flex items-center gap-3">
                    <h1 className="flex-1 text-2xl font-bold">Users</h1>
                </header>
                <ol className="flex flex-col">
                    {allUsers.users.map((user) => (
                        <li
                            key={`users[${user.id}]`}
                            className="bg-secondary odd:bg-inherit hover:bg-key-subtle rounded-md"
                        >
                            <Link
                                className="w-full flex items-center px-2 py-1 h-9"
                                to="/settings/admin/users/$userId"
                                params={{ userId: String(user.id) }}
                            >
                                <div className="flex-1 flex flex-col gap-0.5">
                                    <div className="text-sm font-bold">{user.username}</div>
                                    {user.preferred_name && (
                                        <div className="text-xs text-on-secondary">
                                            {user.preferred_name}
                                        </div>
                                    )}
                                </div>
                                <CaretRightIcon />
                            </Link>
                        </li>
                    ))}
                </ol>
                <TableFooter
                    className="self-center"
                    singularLabel="User"
                    pluralLabel="Users"
                    offset={allUsers.offset}
                    limit={allUsers.limit}
                    total={allUsers.total}
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
})
