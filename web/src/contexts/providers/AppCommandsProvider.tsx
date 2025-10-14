import useAppCommandPaletteContext from "@/hooks/appCommandPaletteContext"
import { type ReactNode, useEffect } from "react"
import type { JsonStructure } from "react-cmdk"

export interface AppCommandsProviderProps {
    readonly items: JsonStructure
    readonly children?: ReactNode
}

export default function AppCommandsProvider({
    items,
    children,
}: AppCommandsProviderProps) {
    const { dispatch } = useAppCommandPaletteContext()
    useEffect(() => {
        dispatch({ type: "mount", items })
        return () => {
            dispatch({ type: "unmount", items })
        }
    }, [items, dispatch])
    return children
}
