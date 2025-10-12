import type { Command } from "@/commands/command"
import useCommandPaletteContext from "@/hooks/commandPaletteContext"
import { type ReactNode, useEffect } from "react"

export interface CommandsProps {
    readonly commands: readonly Command[]
    readonly children?: ReactNode
}

export function Commands({ commands, children }: CommandsProps) {
    const { dispatch } = useCommandPaletteContext()
    useEffect(() => {
        dispatch({ type: "mount", commands })
        return () => {
            dispatch({ type: "unmount", commands })
        }
    }, [dispatch, commands])
    return children
}
