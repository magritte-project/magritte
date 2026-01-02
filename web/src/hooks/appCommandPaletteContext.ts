import { useContext } from "react"

import { AppCommandPaletteContext } from "@/contexts/appCommandPaletteContext"

export default function useAppCommandPaletteContext() {
    const context = useContext(AppCommandPaletteContext)
    if (context === undefined) {
        throw new Error(
            "useAppCommandPaletteContext() used outside of <CommandPaletteContextProvider>",
        )
    }
    return context
}
