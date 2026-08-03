import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react"
import { NotificationIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { readNotifications } from "@/api/queries/users"
import NotificationListItem from "@/components/NotificationListItem"
import ThemedButton from "@/components/theme/ThemedButton"
import ThemedContentUnavailable from "@/components/theme/ThemedContentUnavailable"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useAPI from "@/hooks/apiHook"
import useUserSession from "@/hooks/userSessionHook"

export default function NotificationsButton() {
    const { isSignedIn } = useUserSession()
    const { client } = useAPI()
    const notifications = useQuery(readNotifications(client))

    const unreadCount = useMemo(() => {
        const items = notifications?.data?.items ?? []
        return items.reduce((acc, { is_read: isRead }) => (isRead ? acc : acc + 1), 0)
    }, [notifications?.data])

    return (
        isSignedIn && (
            <Popover className="relative">
                <ThemedSubtleButton
                    buttonComponent={PopoverButton}
                    className="flex items-center gap-1"
                >
                    <NotificationIcon aria-label="Notifications" />
                    {Intl.NumberFormat().format(unreadCount)}
                </ThemedSubtleButton>
                <PopoverPanel
                    anchor="bottom"
                    className="w-2xs bg-white rounded-md shadow-sm flex flex-col items-center"
                >
                    {notifications.isPending ? (
                        <ThemedContentUnavailable variant="inline" />
                    ) : notifications.isError ? (
                        <ThemedContentUnavailable variant="inline" error={notifications.error} />
                    ) : notifications.data.total === 0 ? (
                        <div className="px-4 pt-2 flex flex-col items-center text-gray-500">
                            No notifications
                        </div>
                    ) : (
                        <>
                            <ol className="px-4 flex flex-col w-full">
                                {notifications.data.items.map((notification) => (
                                    <NotificationListItem
                                        key={notification.id}
                                        notification={notification}
                                    />
                                ))}
                            </ol>
                            <ThemedButton
                                className="text-xs font-semibold mx-4 mt-0 mb-2"
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
