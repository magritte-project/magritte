import type { AlbumRead } from "@magritte/api"
import { Link } from "@tanstack/react-router"
import classNames from "classnames"

import LibrarySelectionCheckbox from "@/components/library/LibrarySelectionCheckbox"
import ArtworkImage from "@/components/reusable/ArtworkImage"

export interface LibraryAlbumListItemProps extends Omit<
    React.LiHTMLAttributes<HTMLLIElement>,
    "children"
> {
    readonly libraryId: string
    readonly artistId: number | undefined
    readonly album: AlbumRead
    readonly selected?: boolean
    readonly onToggleSelected?: () => void
}

export default function LibraryAlbumListItem({
    libraryId,
    artistId,
    album,
    className,
    selected,
    onToggleSelected,
    ...rest
}: LibraryAlbumListItemProps) {
    return (
        <li className={classNames("w-36 h-47 hover:bg-key-subtle", className)} {...rest}>
            <Link
                to="/libraries/$libraryId/songs"
                params={{ libraryId }}
                search={{
                    artist_id: artistId,
                    album_id: album.id,
                }}
                title={album.title}
            >
                <ArtworkImage
                    className="h-36 w-36"
                    artworks={album.artworks}
                    itemTitle={album.title}
                    accessory={
                        <LibrarySelectionCheckbox
                            className="absolute left-2 bottom-2"
                            name={`albums[${album.id}]`}
                            checked={selected}
                            onChange={onToggleSelected}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={selected ? "Deselect Album" : "Select Album"}
                        />
                    }
                />
                <span className="line-clamp-2 text-sm" title={album.title}>
                    {album.title}
                </span>
            </Link>
        </li>
    )
}
