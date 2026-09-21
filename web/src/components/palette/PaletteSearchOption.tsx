import { ComboboxOption } from "@headlessui/react"

import type { SearchSourceResult } from "@/commands/searchSources/base"

export interface PaletteSearchOptionProps {
    readonly result: SearchSourceResult
}

export default function PaletteSearchOption({ result }: PaletteSearchOptionProps) {
    return (
        <ComboboxOption
            className="px-4 py-2 text-sm not-last:border-b border-separator data-focus:bg-key data-focus:text-on-key data-disabled:opacity-disabled"
            value={result}
        >
            {result.title}
        </ComboboxOption>
    )
}
