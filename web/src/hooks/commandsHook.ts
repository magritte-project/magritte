import { useEffect, useState } from "react"

import type { CommandDefinition } from "@/commands/definition"

import useCommandInputs from "@/hooks/commandInputsHook"
import useCommandRegistry from "@/hooks/commandRegistryHook"

export interface UseCommandsOptions {
    readonly search: string
}

export default function useCommands({ search }: UseCommandsOptions) {
    const registry = useCommandRegistry()
    const inputs = useCommandInputs()
    const [results, setResults] = useState<readonly CommandDefinition[]>([])

    useEffect(() => {
        if (!search) {
            setResults([])
            return
        }
        function refreshResults() {
            const results = registry.search(search)
            setResults(results)
        }
        const registrySubscription = registry.$events.subscribe((event) => {
            if (event.type === "registeredCommandsDidChange") {
                refreshResults()
            }
        })
        const inputsSubscription = inputs.$events.subscribe((event) => {
            if (event.type === "commandInputsDidChange") {
                refreshResults()
            }
        })
        refreshResults()
        return () => {
            registrySubscription.unsubscribe()
            inputsSubscription.unsubscribe()
        }
    }, [search, inputs, registry])

    return results
}
