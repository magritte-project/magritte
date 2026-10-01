import { CaretLeftIcon, FolderIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"

import { readLibraryHomeSubpaths } from "@/api/queries/libraries"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useAPI from "@/hooks/apiHook"
import { appendPathComponent, lastPathComponent, removeLastPathComponent } from "@/utilities/paths"

export interface LibraryHomeBrowserProps {
    readonly relativeTo: string | null
    readonly onNavigateTo: (newRelativeTo: string) => void
}

export default function LibraryHomeBrowser({ relativeTo, onNavigateTo }: LibraryHomeBrowserProps) {
    const api = useAPI()
    const homeQuery = useQuery(readLibraryHomeSubpaths(api, relativeTo ?? "."))
    if (homeQuery.isPending) {
        return <ThemedContentUnavailable variant="inline" className="h-64" />
    } else if (homeQuery.isError) {
        return (
            <ThemedContentUnavailable variant="inline" className="h-64" error={homeQuery.error} />
        )
    }
    return (
        <ol className="flex flex-col gap-1 h-64 text-sm overflow-x-clip overflow-y-auto">
            <li className="flex items-center gap-2">
                <ThemedSubtleButton
                    type="button"
                    disabled={!relativeTo || relativeTo === "."}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onNavigateTo(removeLastPathComponent(relativeTo ?? "."))
                    }}
                >
                    <CaretLeftIcon size={16} />
                    Back
                </ThemedSubtleButton>
                <h3 className="flex-1 font-semibold">
                    {relativeTo && relativeTo !== "." ? lastPathComponent(relativeTo) : "Home"}
                </h3>
            </li>
            {homeQuery.data.subpaths.map((subpath, index) => (
                <li key={`${subpath}-${index}`}>
                    <button
                        type="button"
                        className="text-start text-nowrap truncate flex items-center gap-1 p-1 w-full hover:bg-blue-100 rounded-list-element"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onNavigateTo(appendPathComponent(relativeTo ?? ".", subpath))
                        }}
                    >
                        <FolderIcon size={16} weight="duotone" />
                        {subpath}
                    </button>
                </li>
            ))}
        </ol>
    )
}
