import { Combobox, ComboboxInput, ComboboxOptions } from "@headlessui/react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr"
import { AnimatePresence, motion } from "motion/react"
import { Suspense, useCallback } from "react"
import { createPortal } from "react-dom"

import type { Command } from "@/commands/base"
import CommandPaletteOption from "@/components/commands/CommandPaletteOption"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import useCommandInputs from "@/hooks/commandInputsHook"
import useCommands from "@/hooks/commandsHook"

export interface CommandPaletteProps {
    readonly isOpen: boolean
    readonly setIsOpen: React.Dispatch<React.SetStateAction<boolean>>

    readonly search: string
    readonly setSearch: React.Dispatch<React.SetStateAction<string>>
}

export default function CommandPalette({
    isOpen,
    setIsOpen,
    search,
    setSearch,
}: CommandPaletteProps) {
    const inputs = useCommandInputs()
    const commands = useCommands({ search })

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
                    key="command-palette-backdrop"
                    className="fixed inset-0 bg-black/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={handleClose}
                />
            )}
            {isOpen && (
                <motion.div
                    key="command-palette"
                    className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-xl px-4"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                >
                    <Combobox immediate onChange={handleChange}>
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
                            <div className="flex items-center gap-2 border-b border-gray-200 px-4">
                                <MagnifyingGlassIcon className="shrink-0 text-gray-400" size={16} />
                                <ComboboxInput
                                    className="w-full bg-transparent py-3 text-sm outline-none"
                                    autoFocus
                                    placeholder="Search commands..."
                                    value={search}
                                    onChange={(e) => setSearch(e.currentTarget.value)}
                                    onKeyDown={(e) => e.key === "Escape" && handleClose()}
                                />
                            </div>
                            <ComboboxOptions static className="max-h-80 overflow-y-auto">
                                {commands.length === 0 ? (
                                    <p className="px-4 py-8 text-center text-sm text-gray-400">
                                        No commands found
                                    </p>
                                ) : (
                                    <Suspense
                                        fallback={<ThemedContentUnavailable variant="inline" />}
                                    >
                                        {commands.map((command) => (
                                            <CommandPaletteOption
                                                key={command.id}
                                                inputs={inputs}
                                                command={command}
                                            />
                                        ))}
                                    </Suspense>
                                )}
                            </ComboboxOptions>
                        </div>
                    </Combobox>
                </motion.div>
            )}
        </AnimatePresence>,
        document.getElementById("app-cmdk")!,
    )
}
