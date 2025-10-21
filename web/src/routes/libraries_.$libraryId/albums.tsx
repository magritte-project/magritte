import { useReadLibraryAlbumsQuery } from "@/api/hooks/libraries"
import ArtworkImage from "@/components/ArtworkImage"
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
                <footer className="text-sm text-gray-700 self-center">
                    {new Intl.NumberFormat().format(page.total)} Albums
                </footer>
            </div>
        )
    },
})
