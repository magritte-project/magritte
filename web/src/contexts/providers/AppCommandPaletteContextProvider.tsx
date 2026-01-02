import type { JsonStructure } from "react-cmdk"

import { type ReactNode, useReducer, useState } from "react"

import {
    AppCommandPaletteContext,
    type AppCommandPaletteContextMessage,
} from "@/contexts/appCommandPaletteContext"

function handleMessage(
    items: JsonStructure,
    message: AppCommandPaletteContextMessage,
): JsonStructure {
    switch (message.type) {
        case "mount": {
            const knownIDs = new Set(items.map((item) => item.id))
            const unionItems = [...items]
            for (const toAdd of message.items) {
                if (knownIDs.has(toAdd.id)) {
                    throw new Error(`Duplicate ID ${toAdd.id}`)
                }
                unionItems.push(toAdd)
            }
            return unionItems
        }
        case "unmount": {
            const toRemove = new Set(message.items.map((item) => item.id))
            return items.filter((item) => !toRemove.has(item.id))
        }
    }
}

export interface AppCommandPaletteContextProviderProps {
    readonly children?: ReactNode
}

export default function AppCommandPaletteContextProvider({
    children,
}: AppCommandPaletteContextProviderProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [items, dispatch] = useReducer(handleMessage, [])
    return (
        <AppCommandPaletteContext.Provider value={{ isOpen, setIsOpen, items, dispatch }}>
            {children}
        </AppCommandPaletteContext.Provider>
    )
}
