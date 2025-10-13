import { useReadLibrariesQuery } from "@/api/hooks/libraries"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import { PlusIcon, VinylRecordIcon } from "@phosphor-icons/react"
import { Link, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/libraries")({
    component: function LibrariesComponent() {
        const { data: libraries } = useReadLibrariesQuery()
        return (
            <div className="flex flex-col text-center items-center justify-center gap-2 p-4 min-h-0 h-screen">
                <ol>
                    {libraries.map((library) => (
                        <li
                            key={`library-${library.id}`}
                            className="flex flex-col items-center gap-2"
                            data-testid={`libraries[${library.id}]`}
                        >
                            <Link
                                to="/libraries/$libraryId"
                                params={{ libraryId: String(library.id) }}
                            >
                                <div className="bg-cyan-400 rounded-full w-16 h-16 flex items-center justify-center">
                                    <VinylRecordIcon
                                        className="text-cyan-50"
                                        size="2.5em"
                                        weight="light"
                                    />
                                </div>
                                <div className="text-lg font-semibold">
                                    {library.name}
                                </div>
                            </Link>
                        </li>
                    ))}
                </ol>
                <Link
                    to="/libraries/create"
                    className="flex items-center gap-1 text-blue-500 active:text-blue-400 font-bold"
                >
                    <PlusIcon weight="bold" />
                    Create
                </Link>
            </div>
        )
    },
    pendingComponent() {
        return <ThemedContentUnavailable />
    },
    errorComponent({ error, reset }) {
        return <ThemedContentUnavailable error={error} onRetry={reset} />
    },
})
