import { useEffect, type ReactNode } from "react"
import z4 from "zod"

import type { CommandInput } from "@/commands/inputs/base"

import useCommandInputs from "@/hooks/commandInputsHook"

export interface CommandInputProviderProps<Input extends CommandInput> {
    readonly schema: z4.ZodType<Input>
    readonly value: Input
    readonly children?: ReactNode
}

export default function CommandInputProvider<Input extends CommandInput>({
    schema,
    value,
    children,
}: CommandInputProviderProps<Input>) {
    const inputs = useCommandInputs()
    useEffect(() => {
        inputs.add(schema, value)
        return () => {
            inputs.remove(value)
        }
    }, [inputs, schema, value])
    return children
}
