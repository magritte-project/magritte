import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"

import { readLibraryAlbums } from "@/api/queries/libraries"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import TableFooter from "@/components/reusable/TableFooter"
import useAPIClient from "@/hooks/apiClientHook"

export const Route = createFileRoute("/libraries_/$libraryId/albums")({
    validateSearch: z.object({
        artist_id: z.number().optional(),
        offset: z.number().optional(),
    }),
    component: function LibraryAlbumsComponent() {
        const { libraryId } = Route.useParams()
        const { artist_id: artistId, offset } = Route.useSearch()
        const navigate = useNavigate({ from: Route.fullPath })
        const apiClient = useAPIClient()
        const { data: page } = useSuspenseQuery(
            readLibraryAlbums(apiClient, {
                libraryId: Number(libraryId),
                artistId,
                offset,
            }),
        )
        return (
            <div className="m-2 flex flex-col gap-2">
                {artistId !== undefined && (
                    <Link
                        to="/libraries/$libraryId/songs"
                        params={{ libraryId }}
                        search={{ artist_id: artistId }}
                        className="px-2 py-1 hover:bg-blue-50"
                    >
                        All Songs
                    </Link>
                )}
                <ol className="flex items-start flex-wrap gap-2">
                    {page.items.map((album) => (
                        <li key={`album-${album.id}`} className="w-36 hover:bg-blue-50">
                            <Link
                                to="/libraries/$libraryId/songs"
                                params={{ libraryId }}
                                search={{
                                    artist_id: artistId,
                                    album_id: album.id,
                                }}
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
                            search: (oldSearch) => ({
                                ...oldSearch,
                                offset,
                            }),
                        })
                    }
                />
            </div>
        )
    },
})
