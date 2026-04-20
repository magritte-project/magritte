import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useMemo, useState } from "react"

import type { CommandDefinition } from "@/commands/definition"

import useCommandSystem from "@/hooks/commandSystemHook"

export interface CommandPaletteProps {
    readonly isOpen: boolean
    readonly onChangeOpen: (isOpen: boolean) => void
}

export default function CommandPalette({ isOpen, onChangeOpen }: CommandPaletteProps) {
    const [query, setQuery] = useState("")

    const commandSystem = useCommandSystem()

    const results = useMemo(() => commandSystem.search(query), [commandSystem, query])

    const handleChange = useCallback(
        (command: CommandDefinition | null) => {
            console.log("selected", command)
            onChangeOpen(false)
        },
        [onChangeOpen],
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
                            onChange={(e) => setQuery(e.currentTarget.value)}
                        />
                        <ComboboxOptions
                            className="w-(--input-width) bg-gray-100 rounded-md flex flex-col"
                            anchor="bottom"
                        >
                            {results.map((result) => (
                                <ComboboxOption
                                    className="px-4 py-2 not-last:border-b border-gray-200 data-focus:bg-blue-100"
                                    key={result.item.id}
                                    value={result.item}
                                >
                                    {result.item.displayName}
                                </ComboboxOption>
                            ))}
                        </ComboboxOptions>
                    </Combobox>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
