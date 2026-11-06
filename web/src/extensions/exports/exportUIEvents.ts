import type { UIEvents } from "@magritte/sdk"

import { HotKeyDispatcher } from "@/commands/hotKeyDispatcher"

export function exportUIEvents(hotKeyDispatcher: HotKeyDispatcher): UIEvents {
    const metaKey = hotKeyDispatcher.modifierKey === "meta"
    const ctrlKey = hotKeyDispatcher.modifierKey === "ctrl"
    const shiftKey = false
    return {
        getMeaningfulKeyPresses: async () => [
            { key: "ArrowLeft", metaKey, ctrlKey, shiftKey },
            { key: "ArrowRight", metaKey, ctrlKey, shiftKey },
            { key: "ArrowUp", metaKey, ctrlKey, shiftKey },
            { key: "ArrowDown", metaKey, ctrlKey, shiftKey },
            { key: "k", metaKey, ctrlKey, shiftKey },
        ],
        forwardKeyPress: async (events) => {
            for (const event of events) {
                hotKeyDispatcher.dispatch(event)
            }
        },
    }
}
