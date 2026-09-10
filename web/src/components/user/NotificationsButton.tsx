import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react"
import { BellIcon, BellRingingIcon } from "@phosphor-icons/react"
import classNames from "classnames"
import { useMemo, useSyncExternalStore } from "react"

import ThemedButton from "@/components/theme/ThemedButton"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import NotificationListItem from "@/components/user/NotificationListItem"
import useNotificationCenter from "@/hooks/notificationCenterHook"
import useUserSession from "@/hooks/userSessionHook"
import { filterTo } from "@/utilities/events"

export default function NotificationsButton() {
    const notificationCenter = useNotificationCenter()
    const notifications = useSyncExternalStore(
        (onStoreChange) =>
            notificationCenter.$events(
                filterTo("type", "serverNotificationsDidChange", onStoreChange),
            ),
        () => notificationCenter.serverNotifications,
    )

    const { isSignedIn } = useUserSession()

    const [unreadCount, formattedUnreadCount] = useMemo(() => {
        const unreadCount = notifications.reduce(
            (acc, { is_read: isRead }) => (isRead ? acc : acc + 1),
            0,
        )
        const formattedUnreadCount = Intl.NumberFormat().format(unreadCount)
        return [unreadCount, formattedUnreadCount] as const
    }, [notifications])

    return (
        isSignedIn && (
            <Popover className="relative">
                <ThemedSubtleButton
                    buttonComponent={PopoverButton}
                    className="flex items-center gap-1 relative group"
                    title={
                        unreadCount > 0
                            ? `${formattedUnreadCount} unread notifications`
                            : "No Unread Notifications"
                    }
                >
                    {unreadCount > 0 ? (
                        <BellRingingIcon aria-hidden size="1.2rem" />
                    ) : (
                        <BellIcon aria-hidden size="1.2rem" />
                    )}
                    {unreadCount > 0 && (
                        <div
                            className={classNames(
                                "absolute top-0 right-0 -translate-y-1/3 translate-x-1/3",
                                "bg-key group-active:bg-key-active text-on-key group-active:text-on-key-active",
                                "text-xs font-semibold",
                                "p-0.5 min-w-6 rounded-full",
                            )}
                            aria-hidden
                        >
                            {formattedUnreadCount}
                        </div>
                    )}
                </ThemedSubtleButton>
                <PopoverPanel
                    anchor="bottom end"
                    className="w-2xs bg-primary rounded-md shadow-sm flex flex-col items-center"
                >
                    {notifications.length === 0 ? (
                        <div className="p-outside flex flex-col items-center text-on-secondary text-sm font-medium">
                            No notifications
                        </div>
                    ) : (
                        <>
                            <ol className="px-outside flex flex-col w-full">
                                {notifications.map((notification) => (
                                    <NotificationListItem
                                        key={notification.id}
                                        notification={notification}
                                    />
                                ))}
                            </ol>
                            <ThemedButton
                                className="text-xs font-semibold mx-outside mt-0 mb-2"
                                disabled={unreadCount === 0}
                            >
                                Mark All As Read
                            </ThemedButton>
                        </>
                    )}
                </PopoverPanel>
            </Popover>
        )
    )
}
