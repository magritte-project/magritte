import type { ReadLibrarySongsSortBy } from "@magritte/api"
import classNames from "classnames"

import LibrarySongTableSort from "@/components/library/LibrarySongTableSort"

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
                        <LibrarySongTableSort order={sortBy} setOrder={onChangeSortBy} />
                    </th>
                    <th className=" p-md border-r border-separator">Title</th>
                    <th className="w-14 p-md border-r border-separator">Time</th>
                    <th className=" p-md border-r border-separator">Artist</th>
                    <th className=" p-md border-r border-separator">Album</th>
                    <th className=" p-md">Genre</th>
                </tr>
            </thead>
            <tbody>{children}</tbody>
        </table>
    )
}
