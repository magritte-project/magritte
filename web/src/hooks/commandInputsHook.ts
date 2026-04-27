import { useRouteContext } from "@tanstack/react-router"

import type { CommandInputs } from "@/commands/inputs/base"

export default function useCommandInputs(): CommandInputs {
    const commandInputs = useRouteContext({
        from: "__root__",
        select: (context) => context.commandInputs,
    })
    return commandInputs
}
