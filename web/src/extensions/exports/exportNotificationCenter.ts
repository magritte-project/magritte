import type { NotificationCenter as ExtensionNotificationCenter } from "@magritte/sdk"

import type { NotificationCenter } from "@/notifications/center"

export function exportNotificationCenter(
    notificationCenter: NotificationCenter,
): ExtensionNotificationCenter {
    return {
        showDialog: async (options) => {
            return await notificationCenter.showDialog(options)
        },
        showToast: async (options) => {
            notificationCenter.showToast(options)
        },
    }
}
