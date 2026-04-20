import { useEffect, type ReactNode } from "react"

import type { OnScreenEntity } from "@/commands/onScreen"

import useCommandSystem from "@/hooks/commandSystemHook"

export interface OnScreenCommandContextProviderProps {
    readonly value: readonly OnScreenEntity[]
    readonly children?: ReactNode
}

export default function OnScreenCommandContextProvider({
    value,
    children,
}: OnScreenCommandContextProviderProps) {
    const commandSystem = useCommandSystem()
    useEffect(() => {
        const publishedEntity = commandSystem.onScreenContext.publish(value)
        return () => {
            commandSystem.onScreenContext.revoke(publishedEntity)
        }
    }, [commandSystem, value])
    return children
}
