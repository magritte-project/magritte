import type { ToastOptions, DialogType } from "@magritte/sdk"
import { CheckCircleIcon, type Icon } from "@phosphor-icons/react"
import { CircleIcon, WarningCircleIcon } from "@phosphor-icons/react"
import classNames from "classnames"
import { motion } from "motion/react"

const ICONS = {
    success: { icon: CheckCircleIcon, label: "Success" },
    error: { icon: WarningCircleIcon, label: "Error" },
    info: { icon: CircleIcon, label: "Notice" },
} satisfies Record<DialogType, { icon: Icon; label: string }>

export interface ToastNotificationProps extends ToastOptions {
    readonly className?: string
}

export default function ToastNotification({ className, message, type }: ToastNotificationProps) {
    const { icon: Icon, label } = ICONS[type]
    return (
        <motion.div
            id="toast-notification"
            aria-live="polite"
            className={classNames(
                "bg-primary border border-separator drop-shadow-lg rounded-md p-2 flex items-center gap-1 z-100",
                className,
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
        >
            <Icon size="1rem" aria-label={label} />
            <span className="font-medium text-sm">{message}</span>
        </motion.div>
    )
}
