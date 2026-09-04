import type { ReadLibrarySongsSortBy } from "@magritte/api"
import classNames from "classnames"

import SongSortButton from "@/components/SongSortButton"

export interface LibrarySongTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    readonly sortBy: ReadLibrarySongsSortBy
    readonly onChangeSortBy: (sortBy: React.SetStateAction<ReadLibrarySongsSortBy>) => void
}

export default function LibrarySongTable({
    sortBy,
    onChangeSortBy,
    className,
    children,
    ...rest
}: LibrarySongTableProps) {
    return (
        <table className={classNames("w-full table-fixed", className)} {...rest}>
            <thead>
                <tr className="text-left font-semibold text-sm border-b border-separator">
                    <th className="w-8">
                        <SongSortButton order={sortBy} setOrder={onChangeSortBy} />
                    </th>
                    <th className="p-2 border-r border-separator">Title</th>
                    <th className="w-14 p-2 border-r border-separator">Time</th>
                    <th className="p-2 border-r border-separator">Artist</th>
                    <th className="p-2 border-r border-separator">Album</th>
                    <th className="p-2">Genre</th>
                </tr>
            </thead>
            <tbody>{children}</tbody>
        </table>
    )
}
