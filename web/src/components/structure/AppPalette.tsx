import { secondsToMilliseconds } from "motion/react"
import { useCallback, useRef, useState } from "react"

import Palette, { type PaletteView } from "@/components/palette/Palette"
import useAppPaletteContext from "@/hooks/appPaletteContext"
import useHotKey from "@/hooks/hotKeyHook"
import { resolveNewValue } from "@/utilities/react"

const STATE_MEMORY_LIMIT = secondsToMilliseconds(60 * 7)

export default function AppPalette() {
    const [search, setSearch] = useState("")
    const [view, setView] = useState<PaletteView>("command")

    const { isOpen, setIsOpen: _setIsOpen } = useAppPaletteContext()
    const lastClosedRef = useRef(new Date())
    const setIsOpen = useCallback(
        (newValue: React.SetStateAction<boolean>) => {
            _setIsOpen((oldValue) => {
                const isOpen = resolveNewValue(oldValue, newValue)
                if (isOpen != oldValue) {
                    if (!isOpen) {
                        lastClosedRef.current = new Date()
                    } else if (Date.now() - lastClosedRef.current.getTime() > STATE_MEMORY_LIMIT) {
                        setSearch("")
                        setView("command")
                    }
                }
                return isOpen
            })
        },
        [_setIsOpen],
    )

    useHotKey({ key: "k" }, () => {
        setIsOpen((oldValue) => !oldValue)
        return true
    })

    return (
        <Palette
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            view={view}
            setView={setView}
            search={search}
            setSearch={setSearch}
        />
    )
}
