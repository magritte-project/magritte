import { useEffect, type ReactNode } from "react"

import type { CommandDefinition } from "@/commands/definition"

import useCommandRegistry from "@/hooks/commandRegistryHook"

export interface CommandsProviderProps {
    readonly commands: readonly CommandDefinition[]
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
