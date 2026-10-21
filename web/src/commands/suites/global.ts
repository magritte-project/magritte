import { ArrowsInIcon, ArrowsOutIcon, GearIcon } from "@phosphor-icons/react"
import type { RegisteredRouter } from "@tanstack/react-router"

import type { Command } from "@/commands/base"

export function globalCommands(router: RegisteredRouter): Command[] {
    return [
        {
            id: "global.settings",
            searchTerms: "settings",
            requiredInputKinds: [],
            highlightAvailability: false,
            present: async () => ({ icon: GearIcon, displayName: "settings: open" }),
            execute: async () => router.navigate({ to: "/settings" }),
        },
        {
            id: "global.enterFullScreen",
            searchTerms: "enter full screen",
            requiredInputKinds: [],
            highlightAvailability: false,
            present: async () => ({
                icon: ArrowsOutIcon,
                displayName: "full screen: enter",
                disabled: !!document.fullscreenElement,
            }),
            execute: async () =>
                document.documentElement.requestFullscreen({ navigationUI: "hide" }),
        },

        {
            id: "global.exitFullScreen",
            searchTerms: "exit full screen",
            requiredInputKinds: [],
            highlightAvailability: false,
            present: async () => ({
                icon: ArrowsInIcon,
                displayName: "full screen: exit",
                disabled: !document.fullscreenElement,
            }),
            execute: async () => document.exitFullscreen(),
        },
    ]
}
