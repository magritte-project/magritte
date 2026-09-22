import { Combobox, ComboboxInput, ComboboxOptions } from "@headlessui/react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useState } from "react"
import { createPortal } from "react-dom"

import type { Command, SearchCommandItem } from "@/commands/base"
import PaletteCommandResults from "@/components/palette/PaletteCommandResults"
import PaletteSearchResults from "@/components/palette/PaletteSearchResults"
import useCommandInputs from "@/hooks/commandInputsHook"

export type PaletteView = "command" | "search"

export interface PaletteProps {
    readonly isOpen: boolean
    readonly setIsOpen: React.Dispatch<React.SetStateAction<boolean>>

    readonly search: string
    readonly setSearch: React.Dispatch<React.SetStateAction<string>>
}

export default function Palette({ isOpen, setIsOpen, search, setSearch }: PaletteProps) {
    const [view, setView] = useState<PaletteView>("command")
    const inputs = useCommandInputs()

    const handleClose = useCallback(() => {
        setSearch("")
        setIsOpen(false)
    }, [setSearch, setIsOpen])

    const handleChange = useCallback(
        (value: object | null) => {
            if (value !== null) {
                switch (view) {
                    case "command": {
                        const command = value as Command
                        command.execute(inputs)
                        break
                    }
                    case "search": {
                        const item = value as SearchCommandItem
                        item.reveal?.()
                        break
                    }
                }
                handleClose()
            }
        },
        [view, inputs, handleClose],
    )

    const handleInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setSearch(event.currentTarget.value)
        },
        [setSearch],
    )

    const handleInputKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Escape") {
                event.stopPropagation()
                event.preventDefault()
                handleClose()
            } else if (event.key === "Tab") {
                event.stopPropagation()
                event.preventDefault()
                setView((oldView) => {
                    switch (oldView) {
                        case "command":
                            return "search"
                        case "search":
                            return "command"
                    }
                })
            }
        },
        [handleClose],
    )

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="paletteBackdrop"
                    className="fixed inset-0 overlay-material-soft"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={handleClose}
                />
            )}
            {isOpen && (
                <motion.div
                    key="palette"
                    className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-xl px-outside"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                >
                    <Combobox immediate onChange={handleChange}>
                        <div className="overflow-hidden rounded-xl border border-outline bg-primary shadow-2xl">
                            <div className="flex items-center gap-2 border-b border-outline px-outside">
                                <MagnifyingGlassIcon
                                    className="shrink-0 text-placeholder"
                                    size={16}
                                />
                                <ComboboxInput
                                    className="flex-1 bg-transparent py-between text-sm outline-none"
                                    autoFocus
                                    placeholder="Search commands..."
                                    value={search}
                                    onChange={handleInputChange}
                                    onKeyDown={handleInputKeyDown}
                                />
                                <div role="radiogroup" className="flex gap-between">
                                    <button
                                        type="button"
                                        className="text-xs font-bold aria-checked:text-key cursor-pointer"
                                        role="radio"
                                        aria-checked={view === "command"}
                                        onClick={() => setView("command")}
                                    >
                                        Commands
                                    </button>
                                    <button
                                        type="button"
                                        className="text-xs font-bold aria-checked:text-key cursor-pointer"
                                        role="radio"
                                        aria-checked={view === "search"}
                                        onClick={() => setView("search")}
                                    >
                                        Search
                                    </button>
                                </div>
                            </div>
                            <ComboboxOptions static className="max-h-80 overflow-y-auto">
                                {view === "command" && <PaletteCommandResults search={search} />}
                                {view === "search" && <PaletteSearchResults search={search} />}
                            </ComboboxOptions>
                        </div>
                    </Combobox>
                </motion.div>
            )}
        </AnimatePresence>,
        document.getElementById("app-cmdk")!,
    )
}
