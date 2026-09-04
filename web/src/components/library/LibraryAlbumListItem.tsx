import type { AlbumRead } from "@magritte/api"
import { Link } from "@tanstack/react-router"
import classNames from "classnames"

import ArtworkImage from "@/components/reusable/ArtworkImage"
import ThemedCheckbox from "@/components/theme/ThemedCheckbox"

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
        <li className={classNames("w-36 h-47 hover:bg-key-subtle rounded-md", className)} {...rest}>
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
                    className="h-36 w-36 shadow-md"
                    artworks={album.artworks}
                    itemTitle={album.title}
                    accessory={
                        <ThemedCheckbox
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
