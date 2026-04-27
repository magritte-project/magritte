import { useEffect, type ReactNode } from "react"
import z4 from "zod"

import type { CommandInput } from "@/commands/inputs/base"

import useCommandInputs from "@/hooks/commandInputsHook"

export interface CommandInputContextProviderProps<Input extends CommandInput> {
    readonly schema: z4.ZodType<Input>
    readonly value: Input
    readonly children?: ReactNode
}

export default function CommandInputContextProvider<Input extends CommandInput>({
    schema,
    value,
    children,
}: CommandInputContextProviderProps<Input>) {
    const commandInputs = useCommandInputs()
    useEffect(() => {
        commandInputs.add(schema, value)
        return () => {
            commandInputs.remove(value)
        }
    }, [commandInputs, value])
    return children
}
