import { useEffect, type ReactNode } from "react"

import type { Command } from "@/commands/base"
import useCommandRegistry from "@/hooks/commandRegistryHook"

export interface CommandsProviderProps {
    readonly commands: readonly Command[]
    readonly children?: ReactNode
}
export default function CommandsProvider({ commands, children }: CommandsProviderProps) {
    const registry = useCommandRegistry()
    useEffect(() => {
        registry.add(...commands)
        return () => {
            registry.remove(...commands)
        }
    }, [commands, registry])

    return children
}
