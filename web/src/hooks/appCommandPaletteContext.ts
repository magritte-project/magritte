import { AppCommandPaletteContext } from "@/contexts/appCommandPaletteContext"
import { useContext } from "react"

export default function useAppCommandPaletteContext() {
    const context = useContext(AppCommandPaletteContext)
    if (context === undefined) {
        throw new Error(
            "useAppCommandPaletteContext() used outside of <CommandPaletteContextProvider>",
        )
    }
    return context
}
