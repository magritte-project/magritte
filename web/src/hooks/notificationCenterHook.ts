import { useRouteContext } from "@tanstack/react-router"

import type { NotificationCenter } from "@/notifications/center"

export default function useNotificationCenter(): NotificationCenter {
    const notificationCenter = useRouteContext({
        from: "__root__",
        select: (context) => context.notificationCenter,
    })
    return notificationCenter
}
