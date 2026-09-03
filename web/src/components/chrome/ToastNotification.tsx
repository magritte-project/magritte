import type { ToastOptions } from "@magritte/sdk"
import classNames from "classnames"
import { motion } from "motion/react"

import DialogIcon from "@/components/reusable/DialogIcon"

export interface ToastNotificationProps extends ToastOptions {
    readonly className?: string
}

export default function ToastNotification({ className, message, type }: ToastNotificationProps) {
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
            <DialogIcon type={type} size="1rem" />
            <span className="font-medium text-sm">{message}</span>
        </motion.div>
    )
}
