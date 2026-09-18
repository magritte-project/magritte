import { AnimatePresence } from "motion/react"
import { useSyncExternalStore, type ReactNode } from "react"
import { createPortal } from "react-dom"

import DialogModal from "@/components/chrome/DialogModal"
import ToastNotification from "@/components/chrome/ToastNotification"
import useNotificationCenter from "@/hooks/notificationCenterHook"
import { justEventsMatching } from "@/utilities/events"

export interface NotificationCenterLayoutProps {
    readonly children?: ReactNode
}

export default function NotificationCenterLayout({ children }: NotificationCenterLayoutProps) {
    const notificationCenter = useNotificationCenter()

    const presentedDialog = useSyncExternalStore(
        (onStoreChange) =>
            notificationCenter.subscribe(
                justEventsMatching("type", "dialogDidChange", onStoreChange),
            ),
        () => notificationCenter.dialog,
    )
    const presentedToast = useSyncExternalStore(
        (onStoreChange) =>
            notificationCenter.subscribe(
                justEventsMatching("type", "toastDidChange", onStoreChange),
            ),
        () => notificationCenter.toast,
    )

    return (
        <>
            {children}
            {createPortal(
                <AnimatePresence mode="wait" key="NotificationCenterLayout.dialog">
                    {presentedDialog !== null && (
                        <DialogModal
                            options={presentedDialog}
                            onDismiss={(buttonId) => notificationCenter.dismissDialog(buttonId)}
                        />
                    )}
                </AnimatePresence>,
                document.getElementById("app-modals")!,
                "NotificationCenterLayout.dialog",
            )}
            {createPortal(
                <AnimatePresence mode="wait" key="NotificationCenterLayout.toast">
                    {presentedToast && (
                        <ToastNotification
                            className="fixed bottom-outside left-1/2 -translate-1/2 max-w-lg"
                            {...presentedToast}
                        />
                    )}
                </AnimatePresence>,
                document.getElementById("app-toasts")!,
                "NotificationCenterLayout.toast",
            )}
        </>
    )
}
