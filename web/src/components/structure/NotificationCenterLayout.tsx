import { Description, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react"
import { defaultDialogButtons, DialogButtonID } from "@magritte/sdk"
import { AnimatePresence, motion } from "motion/react"
import { useSyncExternalStore, type ReactNode } from "react"
import { createPortal } from "react-dom"

import ToastNotification from "@/components/chrome/ToastNotification"
import ThemedButton from "@/components/theme/ThemedButton"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useNotificationCenter from "@/hooks/notificationCenterHook"
import { filterTo } from "@/utilities/events"

export interface NotificationCenterLayoutProps {
    readonly children?: ReactNode
}

export default function NotificationCenterLayout({ children }: NotificationCenterLayoutProps) {
    const notificationCenter = useNotificationCenter()

    const presentedDialog = useSyncExternalStore(
        (onStoreChange) =>
            notificationCenter.$events(filterTo("type", "dialogDidChange", onStoreChange)),
        () => notificationCenter.dialog,
    )
    const presentedToast = useSyncExternalStore(
        (onStoreChange) =>
            notificationCenter.$events(filterTo("type", "toastDidChange", onStoreChange)),
        () => notificationCenter.toast,
    )

    return (
        <>
            {children}
            {createPortal(
                <AnimatePresence mode="wait" key="NotificationCenterLayout.dialog">
                    {presentedDialog !== null && (
                        <Dialog
                            static
                            open
                            onClose={() => notificationCenter.dismissDialog(DialogButtonID.cancel)}
                            className="relative"
                        >
                            <DialogBackdrop
                                as={motion.div}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/30 backdrop-blur-xs"
                            />

                            <div className="fixed inset-0 flex w-screen items-center justify-center p-outside">
                                <DialogPanel
                                    as={motion.div}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="max-w-lg space-y-2 p-outside drop-shadow-2xl shadow-black bg-primary/90 rounded-lg"
                                >
                                    <DialogTitle className="font-bold">
                                        {presentedDialog.title}
                                    </DialogTitle>
                                    <Description className="text-sm text-on-secondary">
                                        {presentedDialog.message}
                                    </Description>
                                    <div className="flex items-center justify-end gap-between text-sm">
                                        {(presentedDialog.buttons ?? defaultDialogButtons).map(
                                            (button, index) => {
                                                switch (button.role) {
                                                    case "primary":
                                                    case "destructive":
                                                        return (
                                                            <ThemedButton
                                                                key={`dialog.buttons[${button.id}@${index}]`}
                                                                type="button"
                                                                destructive={
                                                                    button.role === "destructive"
                                                                }
                                                                onClick={() =>
                                                                    notificationCenter.dismissDialog(
                                                                        button.id,
                                                                    )
                                                                }
                                                            >
                                                                {button.label}
                                                            </ThemedButton>
                                                        )
                                                    case "secondary":
                                                        return (
                                                            <ThemedSubtleButton
                                                                key={`dialog.buttons[${button.id}@${index}]`}
                                                                type="button"
                                                                onClick={() =>
                                                                    notificationCenter.dismissDialog(
                                                                        button.id,
                                                                    )
                                                                }
                                                            >
                                                                {button.label}
                                                            </ThemedSubtleButton>
                                                        )
                                                }
                                            },
                                        )}
                                    </div>
                                </DialogPanel>
                            </div>
                        </Dialog>
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
