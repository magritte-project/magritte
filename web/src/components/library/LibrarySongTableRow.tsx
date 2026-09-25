import type { SongRead } from "@magritte/api"
import classNames from "classnames"

import LibrarySongPlaybackControl from "@/components/library/LibrarySongPlaybackControl"
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

interface TableDataCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
    readonly showSeparator?: boolean
}

function TableDataCell({ className, showSeparator = true, ...rest }: TableDataCellProps) {
    return (
        <td
            className={classNames(
                "px-2 py-1 truncate",
                "bg-secondary group-odd:bg-inherit group-hover:bg-key-subtle",
                "first:rounded-l-md last:rounded-r-md",
                { "border-r border-separator": showSeparator },
                className,
            )}
            {...rest}
        />
    )
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
                "cursor-pointer group h-9",
                {
                    "font-medium": playing,
                    "text-red-500": song.sources?.every((source) => source.is_invalid),
                },
                className,
            )}
            {...rest}
        >
            <TableDataCell showSeparator={false}>
                <div className="flex items-center justify-center">
                    {playing ? (
                        <LibrarySongPlaybackControl />
                    ) : (
                        <ThemedCheckbox
                            name={`songs[${song.id}]`}
                            checked={selected}
                            onChange={onToggleSelected}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={selected ? "Deselect Song" : "Select Song"}
                        />
                    )}
                </div>
            </TableDataCell>
            <TableDataCell title={song.title ?? undefined}>{song.title}</TableDataCell>
            <TableDataCell title={song.artist_name ?? undefined}>
                {formatDuration(song.end_time - (song.start_time ?? 0))}
            </TableDataCell>
            <TableDataCell title={song.artist_name ?? undefined}>{song.artist_name}</TableDataCell>
            <TableDataCell title={song.album_title ?? undefined}>{song.album_title}</TableDataCell>
            <TableDataCell showSeparator={false} title={song.genre ?? undefined}>
                {song.genre}
            </TableDataCell>
        </tr>
    )
}
