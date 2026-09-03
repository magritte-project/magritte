import type { Chrome } from "@magritte/sdk"

import type { NotificationCenter } from "@/notifications/center"

export function exportChrome(notificationCenter: NotificationCenter): Chrome {
    return {
        showDialog: async (options) => {
            return await notificationCenter.showDialog(options)
        },
        showToast: async (options) => {
            notificationCenter.showToast(options)
        },
    }
}
