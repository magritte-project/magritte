import { useRouteContext } from "@tanstack/react-router"

import type { HotKeyDispatcher } from "@/commands/hotKeyDispatcher"

export default function useHotKeyDispatcher(): HotKeyDispatcher {
    const hotKeyDispatcher = useRouteContext({
        from: "__root__",
        select: (context) => context.hotKeyDispatcher,
    })
    return hotKeyDispatcher
}
