import type { SongRead } from "@magritte/api"
import classNames from "classnames"

import ThemedCheckbox from "@/components/theme/ThemedCheckbox"
import { formatDuration } from "@/utilities/duration"

export interface LibrarySongTableRowProps extends Omit<
    React.HTMLAttributes<HTMLTableRowElement>,
    "children"
> {
    readonly song: SongRead
    readonly playing?: boolean
    readonly selected?: boolean
    readonly onToggleSelected?: () => void
}

export default function LibrarySongTableRow({
    song,
    playing,
    selected,
    onToggleSelected,
    className,
    ...rest
}: LibrarySongTableRowProps) {
    return (
        <tr
            className={classNames(
                "cursor-pointer bg-secondary odd:bg-inherit hover:bg-key-subtle h-9",
                {
                    "font-medium": playing,
                    "text-red-500": song.sources?.every((source) => source.is_invalid),
                },
                className,
            )}
            {...rest}
        >
            <td className="w-px px-2 py-1">
                <div className="flex items-center justify-center">
                    <ThemedCheckbox
                        name={`songs[${song.id}]`}
                        checked={selected}
                        onChange={onToggleSelected}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={selected ? "Deselect Song" : "Select Song"}
                    />
                </div>
            </td>
            <td className="px-2 py-1 border-r border-separator">{song.title}</td>
            <td className="w-px px-2 py-1 border-r border-separator">
                <span className="truncate">
                    {formatDuration(song.end_time - (song.start_time ?? 0))}
                </span>
            </td>
            <td className="px-2 py-1 border-r border-separator">{song.album_title}</td>
            <td className="px-2 py-1 border-r border-separator">{song.artist_name}</td>
            <td className="px-2 py-1">{song.genre}</td>
        </tr>
    )
}
