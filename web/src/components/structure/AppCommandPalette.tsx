import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"
import { useCallback } from "react"

import type { CommandDefinition } from "@/commands/definition"
import useAppCommandPaletteContext from "@/hooks/appCommandPaletteContext"
import useCommandInputs from "@/hooks/commandInputsHook"
import useCommands from "@/hooks/commandsHook"

export default function AppCommandPalette() {
    const [search, setSearch] = useState("")

    const { isOpen, setIsOpen, modifierKey } = useAppCommandPaletteContext()

    const inputs = useCommandInputs()
    const results = useCommands({ search })

    const handleChange = useCallback(
        (command: CommandDefinition | null) => {
            console.log("selected", command)
            if (command !== null) {
                command.execute(inputs)
            }
            setIsOpen(false)
        },
        [inputs, setIsOpen],
    )

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((modifierKey === "meta" ? event.metaKey : event.ctrlKey) && event.key === "k") {
                event.stopPropagation()
                event.preventDefault()
                setIsOpen((oldValue) => !oldValue)
            }
        }
        document.addEventListener("keydown", onKeyDown)
        return () => {
            document.removeEventListener("keydown", onKeyDown)
        }
    }, [setIsOpen, modifierKey])

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
                            onChange={(e) => setSearch(e.currentTarget.value)}
                        />
                        <ComboboxOptions
                            className="w-(--input-width) bg-gray-100 rounded-md flex flex-col"
                            anchor="bottom"
                        >
                            {results.map((result) => {
                                const { displayName, disabled } = result.present(inputs)
                                return (
                                    <ComboboxOption
                                        className="px-4 py-2 not-last:border-b border-gray-200 data-focus:bg-blue-100 data-disabled:opacity-50"
                                        key={result.id}
                                        value={result}
                                        disabled={disabled}
                                    >
                                        {displayName}
                                    </ComboboxOption>
                                )
                            })}
                        </ComboboxOptions>
                    </Combobox>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
