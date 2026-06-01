import { type CommandInput } from "@magritte/sdk"
import { useEffect, type ReactNode } from "react"

import useCommandInputs from "@/hooks/commandInputsHook"

export interface CommandInputProviderProps {
    readonly value: readonly CommandInput[]
    readonly children?: ReactNode
}

export default function CommandInputProvider({ value, children }: CommandInputProviderProps) {
    const inputs = useCommandInputs()
    useEffect(() => {
        for (const input of value) {
            inputs.add(input)
        }
        return () => {
            for (const input of value) {
                inputs.remove(input.kind, input.id)
            }
        }
    }, [inputs, value])
    return children
}
