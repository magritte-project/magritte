import { useState } from "react"

import Palette from "@/components/palette/Palette"
import useAppPaletteContext from "@/hooks/appPaletteContext"
import useHotKey from "@/hooks/hotKeyHook"

export default function AppPalette() {
    const [search, setSearch] = useState("")

    const { isOpen, setIsOpen } = useAppPaletteContext()

    useHotKey({ key: "k" }, () => {
        setIsOpen((oldValue) => !oldValue)
        return true
    })

    return <Palette isOpen={isOpen} setIsOpen={setIsOpen} search={search} setSearch={setSearch} />
}
