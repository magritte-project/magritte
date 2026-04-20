import { useRouteContext } from "@tanstack/react-router"

import type { CommandSystem } from "@/commands/system"

export default function useCommandSystem(): CommandSystem {
    const commandSystem = useRouteContext({
        from: "__root__",
        select: (context) => context.commandSystem,
    })
    return commandSystem
}
