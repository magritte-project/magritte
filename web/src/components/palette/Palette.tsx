import { Combobox, ComboboxInput, ComboboxOptions } from "@headlessui/react"
import { BooksIcon, GearIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useDebounce } from "@uidotdev/usehooks"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useRef } from "react"
import { createPortal } from "react-dom"

import type { Command, SearchCommandItem } from "@/commands/base"
import PaletteCommandsView from "@/components/palette/PaletteCommandsView"
import PaletteSearchCommandView from "@/components/palette/PaletteSearchCommandView"
import ThemedTabItemLabel from "@/components/theme/ThemedTabItemLabel"
import useCommandInputs from "@/hooks/commandInputsHook"
import useSearchCommands from "@/hooks/searchCommandsHook"

export type PaletteView = "command" | "search"

export interface PaletteProps {
    readonly isOpen: boolean
    readonly setIsOpen: React.Dispatch<React.SetStateAction<boolean>>

    readonly view: string
    readonly setView: React.Dispatch<React.SetStateAction<PaletteView>>

    readonly search: string
    readonly setSearch: React.Dispatch<React.SetStateAction<string>>
}

export default function Palette({
    isOpen,
    setIsOpen,
    view,
    setView,
    search,
    setSearch,
}: PaletteProps) {
    const inputs = useCommandInputs()
    const { playItem, addItemToLibrary, revealItem } = useSearchCommands()

    const keyModifiersRef = useRef({ shift: false, ctrl: false })
    useEffect(() => {
        const trackModifiers = (event: KeyboardEvent) => {
            keyModifiersRef.current = { shift: event.shiftKey, ctrl: event.ctrlKey }
        }
        document.addEventListener("keydown", trackModifiers)
        document.addEventListener("keyup", trackModifiers)
        return () => {
            document.removeEventListener("keydown", trackModifiers)
            document.removeEventListener("keyup", trackModifiers)
        }
    }, [])

    const showLegend = useDebounce(search.length === 0, 1_000)

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
                        const { shift, ctrl } = keyModifiersRef.current
                        const item = value as SearchCommandItem
                        if (shift) {
                            playItem(item)
                        } else if (ctrl) {
                            addItemToLibrary(item)
                        } else {
                            revealItem(item)
                        }
                        break
                    }
                }
                handleClose()
            }
        },
        [view, inputs, playItem, addItemToLibrary, revealItem, handleClose],
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
                if (event.currentTarget.value.length > 0) {
                    setSearch("")
                } else {
                    handleClose()
                }
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
        [handleClose, setSearch, setView],
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
                    className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-xl px-lg"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                >
                    <Combobox immediate onChange={handleChange}>
                        <div className="overflow-hidden rounded-xl border border-outline bg-primary shadow-2xl">
                            <div className="flex items-center gap-md border-b border-outline px-lg">
                                <MagnifyingGlassIcon
                                    className="shrink-0 text-placeholder"
                                    size={16}
                                />
                                <ComboboxInput
                                    className="flex-1 bg-transparent py-lg text-sm outline-none"
                                    autoFocus
                                    placeholder={
                                        view === "command"
                                            ? "Type a command..."
                                            : "Type a song, album, artist..."
                                    }
                                    value={search}
                                    onChange={handleInputChange}
                                    onKeyDown={handleInputKeyDown}
                                />
                                <div role="radiogroup" className="flex items-center">
                                    <button
                                        type="button"
                                        className="group text-xs cursor-pointer"
                                        role="radio"
                                        aria-checked={view === "command"}
                                        onClick={() => setView("command")}
                                    >
                                        <ThemedTabItemLabel
                                            isActive={view === "command"}
                                            icon={GearIcon}
                                            label="Commands"
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        className="group text-xs cursor-pointer"
                                        role="radio"
                                        aria-checked={view === "search"}
                                        onClick={() => setView("search")}
                                    >
                                        <ThemedTabItemLabel
                                            isActive={view === "search"}
                                            icon={BooksIcon}
                                            label="Library"
                                        />
                                    </button>
                                </div>
                            </div>
                            <ComboboxOptions static className="relative max-h-80 overflow-y-auto">
                                {view === "command" && <PaletteCommandsView search={search} />}
                                {view === "search" && <PaletteSearchCommandView search={search} />}
                                <AnimatePresence mode="wait">
                                    {showLegend && (
                                        <motion.div
                                            key="paletteCommandLegend"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="sticky bottom-0 border-t border-separator bg-secondary text-xs flex items-center justify-end gap-lg px-lg py-md"
                                        >
                                            {view === "command" && (
                                                <>
                                                    <span>↵ Run</span>
                                                </>
                                            )}
                                            {view === "search" && (
                                                <>
                                                    <span>↵ Reveal</span>
                                                    <span>⇧↵ Play</span>
                                                    <span>⌃↵ Add to Library</span>
                                                </>
                                            )}
                                            <span>↹ Next View</span>
                                            <span>⎋ Close</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </ComboboxOptions>
                        </div>
                    </Combobox>
                </motion.div>
            )}
        </AnimatePresence>,
        document.getElementById("app-cmdk")!,
    )
}
