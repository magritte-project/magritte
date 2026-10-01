import { FilesIcon, PencilIcon, PlusIcon, WavesIcon } from "@phosphor-icons/react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"

import { readLibraries } from "@/api/queries/libraries"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import ScopeRestricted from "@/components/reusable/ScopeRestricted"
import ThemedLink from "@/components/theme/ThemedLink"
import useAPI from "@/hooks/apiHook"

export const Route = createFileRoute("/libraries/")({
    component: function LibrariesIndex() {
        const navigate = useNavigate()
        const api = useAPI()
        const { data: libraries } = useSuspenseQuery(readLibraries(api))

        return (
            <main className="flex flex-col text-center items-center justify-center gap-2 p-4 min-h-0 h-screen">
                <ol className="flex items-start gap-2 flex-wrap">
                    {libraries.map((library) => (
                        <li key={`library-${library.id}`} data-testid={`libraries[${library.id}]`}>
                            <Link
                                to="/libraries/$libraryId"
                                params={{
                                    libraryId: String(library.id),
                                }}
                                className="flex flex-col items-center gap-3 p-2 rounded-lg hover:bg-key-subtle w-32"
                            >
                                {library.cover_artwork ? (
                                    <ArtworkImage
                                        artworks={[library.cover_artwork]}
                                        className="h-16 w-16 rounded-button!"
                                    />
                                ) : library.home_path !== null ? (
                                    <div className="bg-key text-on-key rounded-button w-16 h-16 flex items-center justify-center drop-shadow-xs">
                                        <FilesIcon size="2.5em" weight="light" />
                                    </div>
                                ) : (
                                    <div className="bg-key text-on-key rounded-button w-16 h-16 flex items-center justify-center drop-shadow-xs">
                                        <WavesIcon size="2.5em" weight="light" />
                                    </div>
                                )}

                                <div className="flex items-center gap-1">
                                    <div className="text-lg font-semibold">{library.name}</div>
                                    <button
                                        type="button"
                                        className="cursor-pointer text-key active:text-key-active disabled:opacity-disabled"
                                        title="Edit"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()

                                            navigate({
                                                to: "/libraries/manage/$libraryId",
                                                params: { libraryId: String(library.id) },
                                            })
                                        }}
                                    >
                                        <PencilIcon weight="duotone" />
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
        )
    },
})
