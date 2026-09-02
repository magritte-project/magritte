import type { ArtistRead } from "@magritte/api"
import { Link } from "@tanstack/react-router"
import classNames from "classnames"

export interface LibraryArtistListItemProps extends Omit<
    React.LiHTMLAttributes<HTMLLIElement>,
    "children"
> {
    readonly libraryId: string
    readonly artist: ArtistRead
    readonly selected?: boolean
    readonly onToggleSelected?: () => void
}

export default function LibraryArtistListItem({
    libraryId,
    artist,
    className,
    selected,
    onToggleSelected,
    ...rest
}: LibraryArtistListItemProps) {
    return (
        <li
            className={classNames(
                " bg-secondary odd:bg-inherit hover:bg-key-subtle flex items-center gap-2 px-2 py-1 h-9",
                className,
            )}
            {...rest}
        >
            <input
                type="checkbox"
                name={`artists[${artist.id}]`}
                checked={selected}
                onChange={onToggleSelected}
            />
            <Link
                to="/libraries/$libraryId/albums"
                params={{ libraryId }}
                search={{ artist_id: artist.id }}
                className="flex-1 cursor-pointer"
            >
                {artist.name}
            </Link>
        </li>
    )
}
