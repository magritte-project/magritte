import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react"

import {
    HotKeysContext,
    type HotKeyDefinition,
    type UnregisterHotKey,
} from "@/contexts/hotKeysContext"

export interface HotKeysContextProviderProps {
    readonly children?: ReactNode
}

export default function HotKeysContextProvider({ children }: HotKeysContextProviderProps) {
    const handlers = useRef<[HotKeyDefinition, () => boolean][]>([])
    const modifierKey = useMemo(() => {
        if (navigator.platform.startsWith("Mac") || navigator.platform === "iPhone") {
            return "meta" as const
        } else {
            return "ctrl" as const
        }
    }, [])
    const registerHotKey = useCallback(
        (key: HotKeyDefinition, handler: () => boolean): UnregisterHotKey => {
            handlers.current.push([key, handler])
            return () => {
                const toRemove = handlers.current.findIndex(
                    ([candidateKey, candidateHandler]) =>
                        candidateKey === key && candidateHandler === handler,
                )
                if (toRemove !== -1) {
                    handlers.current.splice(toRemove, 1)
                }
            }
        },
        [],
    )
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            for (const [definition, handler] of handlers.current) {
                if (definition.key !== event.key) {
                    continue
                }
                if (
                    !(modifierKey === "meta" ? event.metaKey : event.ctrlKey) &&
                    definition.requiresModifier !== false
                ) {
                    continue
                }
                if (!handler()) {
                    continue
                }
                event.stopPropagation()
                event.preventDefault()
                break
            }
        }
        document.addEventListener("keydown", onKeyDown)
        return () => {
            document.removeEventListener("keydown", onKeyDown)
        }
    }, [modifierKey])

    return (
        <HotKeysContext.Provider value={{ registerHotKey, modifierKey }}>
            {children}
        </HotKeysContext.Provider>
    )
}
