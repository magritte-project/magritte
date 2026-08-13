import { useState } from "react"

import CommandPalette from "@/components/commands/CommandPalette"
import useAppCommandPaletteContext from "@/hooks/appCommandPaletteContext"
import useHotKey from "@/hooks/hotKeyHook"

export default function AppCommandPalette() {
    const [search, setSearch] = useState("")

    const { isOpen, setIsOpen } = useAppCommandPaletteContext()

    useHotKey({ key: "k" }, () => {
        setIsOpen((oldValue) => !oldValue)
        return true
    })

    return (
        <CommandPalette
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            search={search}
            setSearch={setSearch}
        />
    )
}
