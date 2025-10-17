import { useReadLibraryAlbumsQuery } from "@/api/hooks/libraries"
import { Link, createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

export const Route = createFileRoute("/libraries_/$libraryId/albums")({
    validateSearch: z.object({
        artist_id: z.number().optional(),
        offset: z.number().optional(),
    }),
    component: function LibraryAlbumsComponent() {
        const { libraryId } = Route.useParams()
        const { artist_id, offset } = Route.useSearch()
        const { data: page } = useReadLibraryAlbumsQuery(
            Number(libraryId),
            artist_id,
            offset,
        )
        return (
            <div className="m-2 flex flex-col gap-2">
                <ol className="flex items-start flex-wrap gap-2">
                    {page.items.map((album) => (
                        <li key={`album-${album.id}`} className="w-36">
                            <Link
                                to="/libraries/$libraryId/songs"
                                params={{ libraryId }}
                                search={{ artist_id, album_id: album.id }}
                            >
                                <div className="flex items-center justify-center h-36 bg-blue-200">
                                    {album.artworks?.length && (
                                        <img
                                            src={`/api/artworks/${album.artworks[0].id}/image`}
                                            alt={`Cover for ${album.title}`}
                                        />
                                    )}
                                </div>
                                <span>{album.title}</span>
                            </Link>
                        </li>
                    ))}
                </ol>
                <footer className="text-sm text-gray-700 self-center">
                    {new Intl.NumberFormat().format(page.total)} Albums
                </footer>
            </div>
        )
    },
})
