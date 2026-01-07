import type { JsonStructure } from "react-cmdk"

import { BooksIcon, FilesIcon, PlusIcon, VinylRecordIcon, WavesIcon } from "@phosphor-icons/react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMemo } from "react"

import { readLibraries } from "@/api/queries/libraries"
import PrimaryHeader from "@/components/chrome/PrimaryHeader"
import ScopeRestricted from "@/components/reusable/ScopeRestricted"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import ThemedLink from "@/components/theme/ThemedLink"
import ThemedTabItemLink from "@/components/theme/ThemedTabItemLink"
import AppCommandsProvider from "@/contexts/providers/AppCommandsProvider"
import useAPIClient from "@/hooks/apiClientHook"

export const Route = createFileRoute("/libraries")({
    component: function LibrariesComponent() {
        const navigate = useNavigate()
        const apiClient = useAPIClient()
        const { data: libraries } = useSuspenseQuery(readLibraries(apiClient))
        const libraryItems = useMemo<JsonStructure>(() => {
            return [
                {
                    id: "libraries.read",
                    heading: "Libraries",
                    items: libraries.map((library) => ({
                        id: `libraries.read[${library.id}]`,
                        icon: VinylRecordIcon,
                        children: library.name,
                        onClick: () =>
                            navigate({
                                to: "/libraries/$libraryId",
                                params: { libraryId: String(library.id) },
                            }),
                    })),
                },
            ]
        }, [navigate, libraries])
        return (
            <AppCommandsProvider items={libraryItems}>
                <div>
                    <PrimaryHeader>
                        <ThemedTabItemLink to="/libraries" icon={BooksIcon} label="Libraries" />
                    </PrimaryHeader>
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
                                        className="flex flex-col items-center gap-3 p-2 rounded-sm hover:bg-blue-50 w-32"
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

                                        <div className="text-lg font-semibold">{library.name}</div>
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
            </AppCommandsProvider>
        )
    },
    pendingComponent() {
        return <ThemedContentUnavailable />
    },
    errorComponent({ error, reset }) {
        return <ThemedContentUnavailable error={error} onRetry={reset} />
    },
})
