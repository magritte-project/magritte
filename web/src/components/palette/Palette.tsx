import { Combobox, ComboboxInput, ComboboxOptions } from "@headlessui/react"
import { BooksIcon, GearIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useDebounce } from "@uidotdev/usehooks"
import classNames from "classnames"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import type { Command, SearchCommandItem } from "@/commands/base"
import PaletteCommandsView from "@/components/palette/PaletteCommandsView"
import PaletteSearchCommandView from "@/components/palette/PaletteSearchCommandView"
import ThemedTabItemLabel from "@/components/theme/ThemedTabItemLabel"
import useCommandInputs from "@/hooks/commandInputsHook"
import useSearchCommands from "@/hooks/searchCommandsHook"
import useStorageValue from "@/hooks/storageValueHook"

export type PaletteView = "command" | "search"

/** Bounds of the palette's height, as a fraction of the active viewport height. */
const PALETTE_MIN_HEIGHT = 0.45
const PALETTE_MAX_HEIGHT = 0.75
const PALETTE_DEFAULT_HEIGHT = PALETTE_MIN_HEIGHT
/** How far a keyboard nudge of the grabber moves the height. */
const PALETTE_HEIGHT_STEP = 0.05

function clampPaletteHeight(fraction: number): number {
    if (!Number.isFinite(fraction)) {
        return PALETTE_DEFAULT_HEIGHT
    }
    return Math.min(PALETTE_MAX_HEIGHT, Math.max(PALETTE_MIN_HEIGHT, fraction))
}

function activeViewportHeight(): number {
    return window.visualViewport?.height ?? window.innerHeight
}

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

    // The stored height is the source of truth between drags; while a drag is in progress the
    // transient height tracks the pointer and is written back to storage once on release.
    const [storedHeight, setStoredHeight] = useStorageValue<number>(
        "palette.heightFraction",
        PALETTE_DEFAULT_HEIGHT,
    )
    const [transientHeight, setTransientHeight] = useState<number | null>(null)
    const height = clampPaletteHeight(transientHeight ?? storedHeight)
    const isResizing = transientHeight !== null
    const dragOriginRef = useRef<{ pointerId: number; startY: number; startHeight: number } | null>(
        null,
    )

    const handleGrabberPointerDown = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (event.button !== 0) {
                return
            }
            event.preventDefault()
            event.currentTarget.setPointerCapture(event.pointerId)
            dragOriginRef.current = {
                pointerId: event.pointerId,
                startY: event.clientY,
                startHeight: clampPaletteHeight(storedHeight),
            }
            setTransientHeight(dragOriginRef.current.startHeight)
        },
        [storedHeight],
    )
    const handleGrabberPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const origin = dragOriginRef.current
        if (origin === null || origin.pointerId !== event.pointerId) {
            return
        }
        const delta = (event.clientY - origin.startY) / activeViewportHeight()
        setTransientHeight(clampPaletteHeight(origin.startHeight + delta))
    }, [])
    const handleGrabberPointerEnd = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const origin = dragOriginRef.current
            if (origin === null || origin.pointerId !== event.pointerId) {
                return
            }
            dragOriginRef.current = null
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId)
            }
            const delta = (event.clientY - origin.startY) / activeViewportHeight()
            setStoredHeight(clampPaletteHeight(origin.startHeight + delta))
            setTransientHeight(null)
        },
        [setStoredHeight],
    )
    const handleGrabberKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            const direction = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0
            if (direction === 0) {
                return
            }
            event.preventDefault()
            setStoredHeight((oldHeight) =>
                clampPaletteHeight(clampPaletteHeight(oldHeight) + direction * PALETTE_HEIGHT_STEP),
            )
        },
        [setStoredHeight],
    )

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
                    className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-xl px-outside"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                >
                    <Combobox immediate onChange={handleChange}>
                        <div
                            className={classNames(
                                "flex flex-col overflow-hidden rounded-xl border border-outline bg-primary shadow-2xl",
                                { "select-none": isResizing },
                            )}
                            style={{ height: `calc(${height} * 100dvh)` }}
                        >
                            <div className="shrink-0 flex items-center gap-2 border-b border-outline px-outside">
                                <MagnifyingGlassIcon
                                    className="shrink-0 text-placeholder"
                                    size={16}
                                />
                                <ComboboxInput
                                    className="flex-1 bg-transparent py-between text-sm outline-none"
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
                            <ComboboxOptions
                                static
                                className="relative flex-1 min-h-0 overflow-y-auto"
                            >
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
                                            className="sticky bottom-0 border-t border-separator bg-secondary text-xs flex items-center justify-end gap-between px-outside py-[calc(var(--spacing-outside)/2)]"
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
                            <div
                                role="separator"
                                aria-orientation="horizontal"
                                aria-label="Resize palette"
                                aria-valuemin={PALETTE_MIN_HEIGHT * 100}
                                aria-valuemax={PALETTE_MAX_HEIGHT * 100}
                                aria-valuenow={Math.round(height * 100)}
                                tabIndex={0}
                                className="shrink-0 h-3 flex items-center justify-center cursor-row-resize touch-none outline-none focus-visible:bg-key-subtle"
                                onPointerDown={handleGrabberPointerDown}
                                onPointerMove={handleGrabberPointerMove}
                                onPointerUp={handleGrabberPointerEnd}
                                onPointerCancel={handleGrabberPointerEnd}
                                onKeyDown={handleGrabberKeyDown}
                            >
                                <div className="w-10 h-1 rounded-full bg-separator" />
                            </div>
                        </div>
                    </Combobox>
                </motion.div>
            )}
        </AnimatePresence>,
        document.getElementById("app-cmdk")!,
    )
}
