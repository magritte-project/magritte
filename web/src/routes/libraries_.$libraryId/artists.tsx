import { readLibraryArtists } from "@/api/queries/libraries"
import useAPIClient from "@/hooks/apiClientHook"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

export const Route = createFileRoute("/libraries_/$libraryId/artists")({
    validateSearch: z.object({
        offset: z.number().optional(),
    }),
    component: function LibraryArtistsComponent() {
        const { libraryId } = Route.useParams()
        const { offset } = Route.useSearch()
        const apiClient = useAPIClient()
        const { data: page } = useSuspenseQuery(
            readLibraryArtists(apiClient, Number(libraryId), offset),
        )
        return (
            <div className="m-2 flex flex-col gap-2">
                <ol>
                    {page.items.map((artist) => (
                        <li
                            key={`artist-${artist.id}`}
                            className="px-2 py-1 bg-gray-50 odd:bg-inherit"
                        >
                            <Link
                                to="/libraries/$libraryId/albums"
                                params={{ libraryId }}
                                search={{ artist_id: artist.id }}
                            >
                                {artist.name}
                            </Link>
                        </li>
                    ))}
                </ol>
                <footer className="text-sm text-gray-700 self-center">
                    {new Intl.NumberFormat().format(page.total)} Artists
                </footer>
            </div>
        )
    },
})
