import { BooksIcon, FilesIcon, PencilIcon, PlusIcon, WavesIcon } from "@phosphor-icons/react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMemo } from "react"

import { readLibraries } from "@/api/queries/libraries"
import type { Command } from "@/commands/base"
import PageHeader from "@/components/chrome/PageHeader"
import ScopeRestricted from "@/components/reusable/ScopeRestricted"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import ThemedLink from "@/components/theme/ThemedLink"
import ThemedTabItemLink from "@/components/theme/ThemedTabItemLink"
import CommandsProvider from "@/contexts/providers/CommandsProvider"
import useAPI from "@/hooks/apiHook"

export const Route = createFileRoute("/libraries")({
    component: function LibrariesComponent() {
        const navigate = useNavigate()
        const api = useAPI()
        const { data: libraries } = useSuspenseQuery(readLibraries(api))

        const libraryCommands = useMemo(() => {
            return libraries.map(
                (library): Command => ({
                    id: `libraries.read[${library.id}]`,
                    searchTerms: `library ${library.name}`,
                    requiredInputKinds: [],
                    present: async () => ({ displayName: library.name, disabled: false }),
                    execute: async () =>
                        navigate({
                            to: "/libraries/$libraryId",
                            params: { libraryId: String(library.id) },
                        }),
                }),
            )
        }, [navigate, libraries])
        return (
            <CommandsProvider commands={libraryCommands}>
                <div>
                    <PageHeader>
                        <ThemedTabItemLink to="/libraries" icon={BooksIcon} label="Libraries" />
                    </PageHeader>
                    <main className="flex flex-col text-center items-center justify-center gap-2 p-4 min-h-0 h-screen">
                        <ol className="flex items-start gap-2 flex-wrap">
                            {libraries.map((library) => (
                                <li
                                    key={`library-${library.id}`}
                                    data-testid={`libraries[${library.id}]`}
                                >
                                    <Link
                                        to="/libraries/$libraryId"
                                        params={{
                                            libraryId: String(library.id),
                                        }}
                                        className="flex flex-col items-center gap-3 p-2 rounded-sm hover:bg-key-subtle w-32"
                                    >
                                        {library.home_path !== null ? (
                                            <div className="bg-cyan-400 rounded-full w-16 h-16 flex items-center justify-center">
                                                <FilesIcon
                                                    className="text-cyan-50"
                                                    size="2.5em"
                                                    weight="light"
                                                />
                                            </div>
                                        ) : (
                                            <div className="bg-teal-400 rounded-full w-16 h-16 flex items-center justify-center">
                                                <WavesIcon
                                                    className="text-cyan-50"
                                                    size="2.5em"
                                                    weight="light"
                                                />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-1">
                                            <div className="text-lg font-semibold">
                                                {library.name}
                                            </div>
                                            <button
                                                type="button"
                                                className="cursor-pointer text-key active:text-key-active disabled:opacity-disabled"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()

                                                    navigate({
                                                        to: "/libraries/manage/$libraryId",
                                                        params: { libraryId: String(library.id) },
                                                    })
                                                }}
                                            >
                                                <PencilIcon aria-label="Edit" weight="duotone" />
                                            </button>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ol>
                        <ScopeRestricted expected={["library:write"]}>
                            <ThemedLink to="/libraries/add" className="flex items-center gap-1">
                                <PlusIcon weight="bold" />
                                Add
                            </ThemedLink>
                        </ScopeRestricted>
                    </main>
                </div>
                <Outlet />
            </CommandsProvider>
        )
    },
    pendingComponent() {
        return <ThemedContentUnavailable />
    },
    errorComponent({ error, reset }) {
        return <ThemedContentUnavailable error={error} onRetry={reset} />
    },
})
