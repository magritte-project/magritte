import { useEffect } from "react"

import type { HotKeyDefinition } from "@/commands/hotKeyDispatcher"
import useHotKeyDispatcher from "@/hooks/hotKeyDispatcherHook"

export default function useHotKey(hotKey: HotKeyDefinition, handler: () => boolean) {
    const hotKeyDispatcher = useHotKeyDispatcher()

    useEffect(() => hotKeyDispatcher.register(hotKey, handler), [hotKeyDispatcher, hotKey, handler])
}
