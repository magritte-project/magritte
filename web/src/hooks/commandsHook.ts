import { useEffect, useState } from "react"

import type { Command } from "@/commands/base"
import useCommandInputs from "@/hooks/commandInputsHook"
import useCommandRegistry from "@/hooks/commandRegistryHook"
import { filterTo, combineUnsubscribers } from "@/utilities/events"

export interface UseCommandsOptions {
    readonly search: string
}

export default function useCommands({ search }: UseCommandsOptions) {
    const registry = useCommandRegistry()
    const inputs = useCommandInputs()
    const [results, setResults] = useState<readonly Command[]>(() => registry.all)

    useEffect(() => {
        if (!search) {
            setResults(registry.all)
            return
        }
        function refreshResults() {
            const results = registry.search(search)
            setResults(results)
        }
        refreshResults()
        return combineUnsubscribers(
            registry.$events(filterTo("type", "registeredCommandsDidChange", refreshResults)),
            inputs.$events(filterTo("type", "commandInputsDidChange", refreshResults)),
        )
    }, [search, inputs, registry])

    return results
}
