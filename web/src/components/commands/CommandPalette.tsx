import { Combobox, ComboboxInput, ComboboxOptions } from "@headlessui/react"
import { AnimatePresence, motion } from "motion/react"
import { Suspense, useCallback } from "react"

import type { Command } from "@/commands/base"
import CommandPaletteOption from "@/components/commands/CommandPaletteOption"
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
            }
            setSearch("")
            setIsOpen(false)
        },
        [inputs, setSearch, setIsOpen],
    )

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed top-1/2 left-1/2 -translate-1/2"
                    key="command-palette"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <Combobox immediate onChange={handleChange}>
                        <ComboboxInput
                            className="border border-gray-200 bg-white px-4 py-2 rounded-md min-w-sm"
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.currentTarget.value)}
                        />
                        <ComboboxOptions
                            className="w-(--input-width) bg-gray-100 rounded-md flex flex-col"
                            anchor="bottom"
                        >
                            <Suspense>
                                {commands.map((command) => (
                                    <CommandPaletteOption
                                        key={command.id}
                                        inputs={inputs}
                                        command={command}
                                    />
                                ))}
                            </Suspense>
                        </ComboboxOptions>
                    </Combobox>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
