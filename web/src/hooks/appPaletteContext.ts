import { useContext } from "react"

import { AppPaletteContext } from "@/contexts/appPaletteContext"

export default function useAppPaletteContext() {
    const context = useContext(AppPaletteContext)
    if (context === undefined) {
        throw new Error("useAppPaletteContext() used outside of <AppPaletteContextProvider>")
    }
    return context
}
