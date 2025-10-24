import { readLibraryAlbums } from "@/api/queries/libraries"
import ArtworkImage from "@/components/ArtworkImage"
import TableFooter from "@/components/TableFooter"
import useAPIClient from "@/hooks/apiClientHook"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"

export const Route = createFileRoute("/libraries_/$libraryId/albums")({
    validateSearch: z.object({
        artist_id: z.number().optional(),
        offset: z.number().optional(),
    }),
    component: function LibraryAlbumsComponent() {
        const { libraryId } = Route.useParams()
        const { artist_id, offset, ...restSearch } = Route.useSearch()
        const navigate = useNavigate()
        const apiClient = useAPIClient()
        const { data: page } = useSuspenseQuery(
            readLibraryAlbums(apiClient, Number(libraryId), artist_id, offset),
        )
        return (
            <div className="m-2 flex flex-col gap-2">
                {artist_id !== undefined && (
                    <Link
                        to="/libraries/$libraryId/songs"
                        params={{ libraryId }}
                        search={{ artist_id }}
                        className="px-2 py-1 hover:bg-blue-50"
                    >
                        All Songs
                    </Link>
                )}
                <ol className="flex items-start flex-wrap gap-2">
                    {page.items.map((album) => (
                        <li
                            key={`album-${album.id}`}
                            className="w-36 hover:bg-blue-50"
                        >
                            <Link
                                to="/libraries/$libraryId/songs"
                                params={{ libraryId }}
                                search={{ artist_id, album_id: album.id }}
                            >
                                <ArtworkImage
                                    className="h-36 w-36"
                                    artworks={album.artworks}
                                    itemTitle={album.title}
                                />
                                <span>{album.title}</span>
                            </Link>
                        </li>
                    ))}
                </ol>
                <TableFooter
                    className="self-center"
                    singularLabel="Album"
                    pluralLabel="Albums"
                    offset={page.offset}
                    limit={page.limit}
                    total={page.total}
                    onChange={(offset, _limit) =>
                        navigate({
                            to: ".",
                            search: {
                                artist_id,
                                offset,
                                ...restSearch,
                            },
                        })
                    }
                />
            </div>
        )
    },
})
