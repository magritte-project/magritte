import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr"
import classNames from "classnames"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useState } from "react"
import { createPortal } from "react-dom"

import type { Command, CommandView } from "@/commands/base"
import CommandPaletteCatalogSearch from "@/components/commands/CommandPaletteCatalogSearch"
import CommandPaletteOption from "@/components/commands/CommandPaletteOption"
import useCommandInputs from "@/hooks/commandInputsHook"
import useCommandRegistry from "@/hooks/commandRegistryHook"
import useCommands from "@/hooks/commandsHook"
import useExtensionRuntime from "@/hooks/extensionRuntimeHook"

interface PresentedView {
    readonly view: CommandView
    /** Text to carry into the view, e.g. when searching a catalog for an unmatched command search */
    readonly initialTerm: string
}

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
    const handleClose = useCallback(() => {
        setSearch("")
        setIsOpen(false)
    }, [setSearch, setIsOpen])

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="command-palette-backdrop"
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
                    key="command-palette"
                    className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-xl px-outside"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                >
                    <CommandPaletteBody
                        search={search}
                        setSearch={setSearch}
                        onClose={handleClose}
                    />
                </motion.div>
            )}
        </AnimatePresence>,
        document.getElementById("app-cmdk")!,
    )
}

interface CommandPaletteBodyProps {
    readonly search: string
    readonly setSearch: React.Dispatch<React.SetStateAction<string>>
    readonly onClose: () => void
}

/** Lives only while the palette is open, so any presented view resets on close */
function CommandPaletteBody({ search, setSearch, onClose }: CommandPaletteBodyProps) {
    const inputs = useCommandInputs()
    const commands = useCommands({ search })
    const registry = useCommandRegistry()
    const extensionRuntime = useExtensionRuntime()
    const [presented, setPresented] = useState<PresentedView | null>(null)

    // When nothing matches, offer to search streaming catalogs for the text instead
    const searchTerm = search.trim()
    const catalogSearches =
        searchTerm && commands.length === 0
            ? registry.all.flatMap((command) =>
                  command.view?.type === "catalogSearch"
                      ? [{ command, extensionId: command.view.extensionId }]
                      : [],
              )
            : []

    const handleChange = useCallback(
        (command: Command | null) => {
            if (command === null) {
                return
            }
            if (command.view !== undefined) {
                // Only the no-results fallback carries the search text into the view
                setPresented({
                    view: command.view,
                    initialTerm: commands.length === 0 ? searchTerm : "",
                })
                setSearch("")
                return
            }
            command.execute(inputs)
            onClose()
        },
        [inputs, commands.length, searchTerm, setSearch, onClose],
    )

    switch (presented?.view.type) {
        case "catalogSearch":
            return (
                <CommandPaletteCatalogSearch
                    extensionId={presented.view.extensionId}
                    initialTerm={presented.initialTerm}
                    onBack={() => setPresented(null)}
                    onClose={onClose}
                />
            )
        default:
            break
    }

    return (
        <Combobox immediate onChange={handleChange}>
            <div className="overflow-hidden rounded-xl border border-outline bg-primary shadow-2xl">
                <div className="flex items-center gap-2 border-b border-outline px-outside">
                    <MagnifyingGlassIcon className="shrink-0 text-placeholder" size={16} />
                    <ComboboxInput
                        className="w-full bg-transparent py-between text-sm outline-none"
                        autoFocus
                        placeholder="Search commands..."
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        onKeyDown={(e) => e.key === "Escape" && onClose()}
                    />
                </div>
                <ComboboxOptions static className="max-h-80 overflow-y-auto">
                    {commands.length === 0 ? (
                        <>
                            <p
                                className={classNames(
                                    "px-4 text-center text-sm text-on-secondary",
                                    catalogSearches.length > 0 ? "py-3" : "py-8",
                                )}
                            >
                                No commands found
                            </p>
                            {catalogSearches.map(({ command, extensionId }) => (
                                <ComboboxOption
                                    key={command.id}
                                    className="flex items-center gap-2 px-4 py-2 text-sm border-t border-separator data-focus:bg-key data-focus:text-on-key"
                                    value={command}
                                >
                                    <MagnifyingGlassIcon className="shrink-0" size={14} />
                                    <span className="truncate">
                                        Search{" "}
                                        {extensionRuntime.getRunning(extensionId)?.manifest.name ??
                                            extensionId}{" "}
                                        for “{searchTerm}”
                                    </span>
                                </ComboboxOption>
                            ))}
                        </>
                    ) : (
                        commands.map((command) => (
                            <CommandPaletteOption
                                key={command.id}
                                inputs={inputs}
                                command={command}
                            />
                        ))
                    )}
                </ComboboxOptions>
            </div>
        </Combobox>
    )
}
