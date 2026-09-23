import { ComboboxOption } from "@headlessui/react"
import { PlayIcon, PlusIcon } from "@phosphor-icons/react"
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr"

import type { SearchCommandItem } from "@/commands/base"
import PaletteOptionIcon from "@/components/palette/PaletteOptionIcon"
import useSearchCommands from "@/hooks/searchCommandsHook"

export interface PaletteSearchOptionProps {
    readonly item: SearchCommandItem
}

export default function PaletteSearchOption({ item }: PaletteSearchOptionProps) {
    const { playItem, addItemToLibrary } = useSearchCommands()
    return (
        <ComboboxOption
            className="group px-4 py-2 text-sm not-last:border-b border-separator data-focus:bg-key data-focus:text-on-key data-disabled:opacity-disabled"
            value={item}
        >
            <div className="flex items-center gap-between">
                <PaletteOptionIcon className="w-8 h-8" icon={item.icon} />
                <div className="flex-1 flex flex-col">
                    <div className="text-medium">{item.title}</div>
                    {item.subtitle && (
                        <div className="text-sm text-on-secondary">{item.subtitle}</div>
                    )}
                </div>
                {item.play && (
                    <button
                        type="button"
                        className="text-sm text-key active:text-key-active group-data-focus:text-on-key group-focus:active:text-on-key-active"
                        title="play"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            playItem(item)
                        }}
                    >
                        <PlayIcon weight="fill" />
                    </button>
                )}
                {item.addToLibrary && (
                    <button
                        type="button"
                        className="text-sm text-key active:text-key-active group-data-focus:text-on-key group-focus:active:text-on-key-active"
                        title="Add to Library"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            addItemToLibrary(item)
                        }}
                    >
                        <PlusIcon weight="bold" />
                    </button>
                )}
                {item.reveal && <CaretRightIcon weight="bold" />}
            </div>
        </ComboboxOption>
    )
}
