import { ComboboxOption } from "@headlessui/react"

import type { SearchCommandItem } from "@/commands/base"
import PaletteOptionIcon from "@/components/palette/PaletteOptionIcon"

export interface PaletteSearchOptionProps {
    readonly item: SearchCommandItem
}

export default function PaletteSearchOption({ item }: PaletteSearchOptionProps) {
    return (
        <ComboboxOption
            className="px-4 py-2 text-sm not-last:border-b border-separator data-focus:bg-key data-focus:text-on-key data-disabled:opacity-disabled"
            value={item}
        >
            <div className="flex items-center gap-between">
                <PaletteOptionIcon className="w-8 h-8" icon={item.icon} />
                <div className="flex flex-col">
                    <div className="text-medium">{item.title}</div>
                    {item.subtitle && (
                        <div className="text-sm text-on-secondary">{item.subtitle}</div>
                    )}
                </div>
            </div>
        </ComboboxOption>
    )
}
