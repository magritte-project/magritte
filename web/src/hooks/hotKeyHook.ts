import { useEffect } from "react"

import { type HotKeyDefinition } from "@/contexts/hotKeysContext"
import useHotKeys from "@/hooks/hotKeysHook"

export default function useHotKey(hotKey: HotKeyDefinition, handler: () => boolean) {
    const { registerHotKey } = useHotKeys()

    useEffect(() => {
        return registerHotKey(hotKey, handler)
    }, [registerHotKey, hotKey, handler])
}
