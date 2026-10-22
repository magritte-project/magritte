import { ArrowsInIcon, ArrowsOutIcon, GearIcon } from "@phosphor-icons/react"
import type { RegisteredRouter } from "@tanstack/react-router"

import type { Command } from "@/commands/base"
import { getMagritteRouterContext } from "@/integrations/tanstack-router/context"

export function globalCommands(router: RegisteredRouter): Command[] {
    return [
        {
            id: "global.settings.general",
            searchTerms: "general settings",
            requiredInputKinds: [],
            highlightAvailability: false,
            present: async () => ({
                icon: GearIcon,
                displayName: "settings: general",
                disabled: !getMagritteRouterContext(router).api.userSessionManager.isSignedIn,
            }),
            execute: async () => router.navigate({ to: "/settings/user/general" }),
        },
        {
            id: "global.settings.extensions.manage",
            searchTerms: "extensions settings",
            requiredInputKinds: [],
            highlightAvailability: false,
            present: async () => ({
                displayName: `settings: extensions`,
                disabled: !getMagritteRouterContext(router).api.userSessionManager.isSignedIn,
            }),
            execute: async () => router.navigate({ to: "/settings/user/extensions" }),
        },
        {
            id: "global.settings.extensions.taskManager",
            searchTerms: "extensions settings task manager",
            requiredInputKinds: [],
            highlightAvailability: false,
            present: async () => ({
                displayName: `settings: extensions: task manager`,
                disabled: !getMagritteRouterContext(router).api.userSessionManager.isSignedIn,
            }),
            execute: async () => router.navigate({ to: "/settings/user/extensions/tasks" }),
        },
        {
            id: "global.settings.theme",
            searchTerms: "theme settings",
            requiredInputKinds: [],
            highlightAvailability: false,
            present: async () => ({
                displayName: `settings: theme`,
                disabled: !getMagritteRouterContext(router).api.userSessionManager.isSignedIn,
            }),
            execute: async () => router.navigate({ to: "/settings/user/theme" }),
        },
        {
            id: "global.settings.downloads",
            searchTerms: "downloads settings",
            requiredInputKinds: [],
            highlightAvailability: false,
            present: async () => ({
                displayName: `settings: downloads`,
                disabled: !getMagritteRouterContext(router).api.userSessionManager.isSignedIn,
            }),
            execute: async () => router.navigate({ to: "/settings/user/downloads" }),
        },
        {
            id: "global.fullScreen.enter",
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
            id: "global.fullScreen.exit",
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
