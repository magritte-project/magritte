import { useDebounce } from "@uidotdev/usehooks"
import { Fragment } from "react/jsx-runtime"

import PaletteSearchOption from "@/components/palette/PaletteSearchOption"
import useSearchCommands from "@/hooks/searchCommandsHook"

export interface PaletteSearchCommandViewProps {
    readonly search: string
}

export default function PaletteSearchCommandView({ search }: PaletteSearchCommandViewProps) {
    const debouncedSearch = useDebounce(search, 300)
    const { resultSections } = useSearchCommands({ search: debouncedSearch })

    return (
        <Fragment key="paletteSearchResults">
            {search.length === 0 ? (
                <p className="px-xl py-8 text-center text-sm text-on-secondary">
                    Search in the current library and your extensions
                </p>
            ) : resultSections.length === 0 ? (
                <p className="px-xl py-8 text-center text-sm text-on-secondary">No results found</p>
            ) : (
                resultSections.map((section, index) => (
                    <Fragment key={`sections[${index}, name: ${section.displayName}]`}>
                        <h3 className="px-xl py-md text-sm text-on-secondary">
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
