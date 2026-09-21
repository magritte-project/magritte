import { useEffect, useState } from "react"
import { Fragment } from "react/jsx-runtime"

import type { SearchSourceResult } from "@/commands/searchSources/base"
import PaletteSearchOption from "@/components/palette/PaletteSearchOption"
import useCommandInputs from "@/hooks/commandInputsHook"
import useSearchRegistry from "@/hooks/searchRegistryHook"

export interface PaletteSearchResultsProps {
    readonly search: string
}

export default function PaletteSearchResults({ search }: PaletteSearchResultsProps) {
    const searchRegistry = useSearchRegistry()
    const inputs = useCommandInputs()
    const [results, setResults] = useState<ReadonlyMap<string, readonly SearchSourceResult[]>>(
        () => new Map(),
    )
    useEffect(() => {
        const controller = new AbortController()
        ;(async () => {
            const searchResults = await searchRegistry.search(search, inputs)
            if (controller.signal.aborted) {
                return
            }
            setResults(searchResults)
        })()
        return () => controller.abort()
    }, [searchRegistry, inputs, search])

    return (
        <Fragment key="paletteResultsResults">
            {results.size === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-on-secondary">No results found</p>
            ) : (
                Array.from(results.entries()).flatMap(([sourceId, results]) =>
                    results.map((result) => (
                        <PaletteSearchOption key={`${sourceId}-${result.id}`} result={result} />
                    )),
                )
            )}
        </Fragment>
    )
}
