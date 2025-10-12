import { CommandPaletteContext } from "@/contexts/commandPaletteContext"
import { useContext } from "react"

export default function useCommandPaletteContext() {
    const context = useContext(CommandPaletteContext)
    if (context === undefined) {
        throw new Error(
            "useCommandPaletteContext() used outside of <CommandPaletteContextProvider>",
        )
    }
    return context
}
