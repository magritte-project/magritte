import { Combobox, ComboboxInput, ComboboxOptions } from "@headlessui/react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr"
import { AnimatePresence, motion } from "motion/react"
import { useCallback } from "react"
import { createPortal } from "react-dom"

import type { Command } from "@/commands/base"
import PaletteCommandResults from "@/components/palette/PaletteCommandResults"
import useCommandInputs from "@/hooks/commandInputsHook"

export interface PaletteProps {
    readonly isOpen: boolean
    readonly setIsOpen: React.Dispatch<React.SetStateAction<boolean>>

    readonly search: string
    readonly setSearch: React.Dispatch<React.SetStateAction<string>>
}

export default function Palette({ isOpen, setIsOpen, search, setSearch }: PaletteProps) {
    const inputs = useCommandInputs()

    const handleChange = useCallback(
        (command: Command | null) => {
            if (command !== null) {
                command.execute(inputs)
                setSearch("")
                setIsOpen(false)
            }
        },
        [inputs, setSearch, setIsOpen],
    )

    const handleClose = useCallback(() => {
        setSearch("")
        setIsOpen(false)
    }, [setSearch, setIsOpen])

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
                                    className="w-full bg-transparent py-between text-sm outline-none"
                                    autoFocus
                                    placeholder="Search commands..."
                                    value={search}
                                    onChange={(e) => setSearch(e.currentTarget.value)}
                                    onKeyDown={(e) => e.key === "Escape" && handleClose()}
                                />
                            </div>
                            <ComboboxOptions static className="max-h-80 overflow-y-auto">
                                <PaletteCommandResults search={search} />
                            </ComboboxOptions>
                        </div>
                    </Combobox>
                </motion.div>
            )}
        </AnimatePresence>,
        document.getElementById("app-cmdk")!,
    )
}
