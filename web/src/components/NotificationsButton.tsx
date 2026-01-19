import { MenuButton } from "@headlessui/react"
import { NotificationIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { readNotifications } from "@/api/queries/users"
import ThemedPopUpMenu, { type ThemedPopUpMenuItem } from "@/components/theme/ThemedPopUpMenu"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useAPIClient from "@/hooks/apiClientHook"
import useUserSession from "@/hooks/userSessionHook"

export default function NotificationsButton() {
    const { isSignedIn } = useUserSession()
    const apiClient = useAPIClient()
    const notificationsQuery = useQuery(readNotifications(apiClient))

    const items = useMemo<readonly ThemedPopUpMenuItem[]>(() => {
        const notifications = notificationsQuery?.data?.items ?? []
        if (notifications.length > 0) {
            return notifications.map((notification) => ({
                key: `notifications[${notification.id}]`,
                label: (
                    <div className="flex flex-col gap-0.5">
                        <div className="text-sm font-semibold text-black">{notification.title}</div>
                        <div className="text-xs text-gray-500">{notification.description}</div>
                    </div>
                ),
                onClick: () => {
                    // Handle notification click
                },
            }))
        } else {
            return [
                {
                    key: "notifications[]",
                    label: "No Notifications",
                    onClick: () => {},
                    disabled: true,
                },
            ]
        }
    }, [notificationsQuery?.data])
    const unreadCount = useMemo(() => {
        const notifications = notificationsQuery?.data?.items ?? []
        return notifications.reduce((acc, { is_read: isRead }) => (isRead ? acc : acc + 1), 0)
    }, [notificationsQuery?.data])

    return (
        isSignedIn && (
            <ThemedPopUpMenu
                button={
                    <ThemedSubtleButton
                        buttonComponent={MenuButton}
                        className="flex items-center gap-1"
                    >
                        <NotificationIcon aria-label="Notifications" />
                        {Intl.NumberFormat().format(unreadCount)}
                    </ThemedSubtleButton>
                }
                items={items}
            />
        )
    )
}
