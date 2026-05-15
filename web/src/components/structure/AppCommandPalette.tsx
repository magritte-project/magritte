import { useEffect, useState } from "react"

import CommandPalette from "@/components/commands/CommandPalette"
import useAppCommandPaletteContext from "@/hooks/appCommandPaletteContext"

export default function AppCommandPalette() {
    const [search, setSearch] = useState("")

    const { isOpen, setIsOpen, modifierKey } = useAppCommandPaletteContext()

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
        <CommandPalette
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            search={search}
            setSearch={setSearch}
        />
    )
}
