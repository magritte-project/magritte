import { useRouteContext } from "@tanstack/react-router"

import type { CommandRegistry } from "@/commands/registry"

export default function useCommandRegistry(): CommandRegistry {
    const commandRegistry = useRouteContext({
        from: "__root__",
        select: (context) => context.commandRegistry,
    })
    return commandRegistry
}
