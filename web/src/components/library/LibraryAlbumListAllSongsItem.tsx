import { Link } from "@tanstack/react-router"

export interface LibraryAlbumListAllSongsItemProps {
    readonly libraryId: string
    readonly artistId: number
}

export default function LibraryAlbumListAllSongsItem({
    libraryId,
    artistId,
}: LibraryAlbumListAllSongsItemProps) {
    return (
        <Link
            to="/libraries/$libraryId/songs"
            params={{ libraryId }}
            search={{ artist_id: artistId }}
            className="px-md py-1 hover:bg-key-subtle"
        >
            All Songs
        </Link>
    )
}
