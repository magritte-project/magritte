import type { NotificationRead } from "@magritte/api"
import { CircleIcon, CheckIcon } from "@phosphor-icons/react"
import { TrashIcon } from "@phosphor-icons/react/dist/ssr"
import classNames from "classnames"
import { useCallback } from "react"

import { useDeleteNotification, useUpdateNotification } from "@/api/mutations/users"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"

export interface NotificationListItemProps extends Omit<
    React.LiHTMLAttributes<HTMLLIElement>,
    "children"
> {
    readonly notification: NotificationRead
}

export default function NotificationListItem({
    className,
    notification,
    ...rest
}: NotificationListItemProps) {
    const updateMutation = useUpdateNotification(notification.id)
    const deleteMutation = useDeleteNotification(notification.id)
    const handleMarkAsRead = useCallback(() => {
        updateMutation.mutate({ is_read: true })
    }, [updateMutation])
    const handleDelete = useCallback(() => {
        deleteMutation.mutate()
    }, [deleteMutation])
    return (
        <li
            className={classNames(
                "py-2 my-2 not-last:border-b border-gray-100 flex items-center gap-2",
                className,
            )}
            {...rest}
        >
            <CircleIcon
                weight={notification.is_read ? "regular" : "fill"}
                size="0.5rem"
                aria-label={notification.is_read ? "Read" : "Unread"}
            />
            <div
                className={classNames("flex-1 flex flex-col gap-0.5", {
                    "opacity-70": notification.is_read,
                })}
            >
                <span className="text-sm font-semibold">{notification.title}</span>
                {notification.description && (
                    <span className="text-xs text-gray-500">{notification.description}</span>
                )}
            </div>
            <ThemedSubtleButton
                disabled={
                    updateMutation.isPending || deleteMutation.isPending || notification.is_read
                }
                onClick={handleMarkAsRead}
            >
                <CheckIcon aria-label="Mark as Read" />
            </ThemedSubtleButton>
            <ThemedSubtleButton
                disabled={updateMutation.isPending || deleteMutation.isPending}
                onClick={handleDelete}
            >
                <TrashIcon aria-label="Delete" />
            </ThemedSubtleButton>
        </li>
    )
}
