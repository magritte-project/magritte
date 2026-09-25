import { useSuspenseQuery } from "@tanstack/react-query"
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMemo } from "react"

import { readLibraries } from "@/api/queries/libraries"
import type { Command } from "@/commands/base"
import PageHeader from "@/components/chrome/PageHeader"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import CommandsProvider from "@/contexts/providers/CommandsProvider"
import useAPI from "@/hooks/apiHook"

export const Route = createFileRoute("/libraries")({
    component: function LibrariesLayout() {
        const navigate = useNavigate()
        const api = useAPI()
        const { data: libraries } = useSuspenseQuery(readLibraries(api))

        const libraryCommands = useMemo(() => {
            return libraries.map(
                (library): Command => ({
                    id: `libraries.read[${library.id}]`,
                    searchTerms: `library ${library.name}`,
                    requiredInputKinds: [],
                    highlightAvailability: false,
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
                <PageHeader />
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
