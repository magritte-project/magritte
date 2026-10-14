import type { ArtistRead } from "@magritte/api"
import { Link } from "@tanstack/react-router"
import classNames from "classnames"

import ThemedCheckbox from "@/components/theme/ThemedCheckbox"

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
                "bg-secondary odd:bg-inherit hover:bg-key-subtle rounded-li",
                "flex items-center gap-md",
                "px-md py-1 h-9",
                className,
            )}
            {...rest}
        >
            <ThemedCheckbox
                name={`artists[${artist.id}]`}
                checked={selected}
                onChange={onToggleSelected}
                onClick={(e) => e.stopPropagation()}
                aria-label={selected ? "Deselect Artist" : "Select Artist"}
            />
            <Link
                to="/libraries/$libraryId/albums"
                params={{ libraryId }}
                search={{ artist_id: artist.id }}
                className="flex-1 cursor-pointer"
                title={artist.name ?? undefined}
            >
                {artist.name}
            </Link>
        </li>
    )
}
