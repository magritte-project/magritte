import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useDebounce } from "@uidotdev/usehooks"
import { Fragment } from "react/jsx-runtime"

import PaletteSearchOption from "@/components/palette/PaletteSearchOption"
import useCommandInputs from "@/hooks/commandInputsHook"
import useSearchRegistry from "@/hooks/searchRegistryHook"

export interface PaletteSearchResultsProps {
    readonly search: string
}

export default function PaletteSearchResults({ search }: PaletteSearchResultsProps) {
    const searchRegistry = useSearchRegistry()
    const inputs = useCommandInputs()
    const debouncedSearch = useDebounce(search, 300)
    const { data: sections = [] } = useQuery({
        queryKey: ["commands", "search", debouncedSearch],
        queryFn: () => searchRegistry.search(debouncedSearch, inputs),
        placeholderData: keepPreviousData,
    })

    return (
        <Fragment key="paletteSearchResults">
            {sections.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-on-secondary">No results found</p>
            ) : (
                sections.map((section, index) => (
                    <Fragment key={`sections[${index}, name: ${section.displayName}]`}>
                        <h3 className="px-4 py-2 text-sm text-on-secondary">
                            {section.displayName}
                        </h3>
                        {section.items.map((item, itemIndex) => (
                            <PaletteSearchOption
                                key={`items[${itemIndex}, id: ${item.id}]`}
                                item={item}
                            />
                        ))}
                    </Fragment>
                ))
            )}
        </Fragment>
    )
}
