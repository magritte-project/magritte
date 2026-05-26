import type { CommandInput } from "@magritte/sdk"
import { useEffect, type ReactNode } from "react"

import useCommandInputs from "@/hooks/commandInputsHook"

export interface CommandInputProviderProps {
    readonly value: CommandInput
    readonly children?: ReactNode
}

export default function CommandInputProvider({ value, children }: CommandInputProviderProps) {
    const inputs = useCommandInputs()
    useEffect(() => {
        inputs.add(value)
        return () => {
            inputs.remove(value)
        }
    }, [inputs, value])
    return children
}
