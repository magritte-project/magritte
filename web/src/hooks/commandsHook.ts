import { useEffect, useState } from "react"

import type { Command } from "@/commands/base"
import useCommandInputs from "@/hooks/commandInputsHook"
import useCommandRegistry from "@/hooks/commandRegistryHook"
import { justEventsMatching, combineUnsubscribers } from "@/utilities/events"

export interface UseCommandsOptions {
    readonly search?: string
}

export default function useCommands({ search }: UseCommandsOptions = {}) {
    const registry = useCommandRegistry()
    const inputs = useCommandInputs()
    const [results, setResults] = useState<readonly Command[]>(() => registry.all)

    useEffect(() => {
        function refreshResults() {
            if (search) {
                const results = registry.search(search)
                setResults(results)
            } else {
                const all = registry.all
                setResults(all)
            }
        }
        refreshResults()
        return combineUnsubscribers(
            registry.subscribe(
                justEventsMatching("type", "registeredCommandsDidChange", refreshResults),
            ),
            inputs.subscribe(justEventsMatching("type", "commandInputsDidChange", refreshResults)),
        )
    }, [search, inputs, registry])

    return results
}
