import { useQuery } from "@tanstack/react-query"

import { readLibraryAlbum, readLibraryArtist } from "@/api/queries/libraries"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import useAPI from "@/hooks/apiHook"

export interface LibraryAlbumHeaderProps {
    readonly libraryId: number
    readonly albumId: number
}

export default function LibraryAlbumHeader({ libraryId, albumId }: LibraryAlbumHeaderProps) {
    const api = useAPI()
    const albumQuery = useQuery(readLibraryAlbum(api, libraryId, albumId))
    const artistQuery = useQuery({
        ...readLibraryArtist(api, libraryId, albumQuery.data?.artist_id ?? 0),
        enabled: albumQuery.isSuccess && albumQuery.data.artist_id !== null,
    })

    return (
        <div className="flex items-center gap-lg">
            <ArtworkImage
                className="h-30 md:h-36 aspect-square"
                artworks={albumQuery.data?.artworks}
                itemTitle={albumQuery.data?.title}
            />
            <div className="flex flex-col gap-sm">
                <div className="font-bold text-lg">{albumQuery.data?.title ?? "--"}</div>
                <div className="text-sm">{artistQuery.data?.name ?? "--"}</div>
            </div>
        </div>
    )
}
