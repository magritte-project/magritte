import type { ToastOptions } from "@magritte/sdk"
import { AnimatePresence } from "motion/react"
import { useCallback, useSyncExternalStore, type ReactNode } from "react"
import { createPortal } from "react-dom"

import ToastNotification from "@/components/chrome/ToastNotification"
import ToastContextProvider from "@/contexts/providers/ToastContextProvider"
import useNotificationCenter from "@/hooks/notificationCenterHook"

export interface ToastLayoutProps {
    readonly children?: ReactNode
}

export default function ToastLayout({ children }: ToastLayoutProps) {
    const notificationCenter = useNotificationCenter()

    const presentedToast = useSyncExternalStore(
        (onStoreChange) => {
            const subscription = notificationCenter.$events.subscribe((event) => {
                switch (event.type) {
                    case "toastDidChange":
                        onStoreChange()
                        break
                    default:
                        break
                }
            })
            return () => subscription.unsubscribe()
        },
        () => notificationCenter.toast,
    )

    const showToast = useCallback(
        (toast: ToastOptions) => notificationCenter.showToast(toast),
        [notificationCenter],
    )
    return (
        <>
            <ToastContextProvider value={{ showToast }}>{children}</ToastContextProvider>
            {createPortal(
                <AnimatePresence mode="wait" key="ToastLayout">
                    {presentedToast && (
                        <ToastNotification
                            className="fixed bottom-outside left-1/2 -translate-1/2 max-w-lg"
                            {...presentedToast}
                        />
                    )}
                </AnimatePresence>,
                document.getElementById("app-toasts")!,
                "ToastLayout",
            )}
        </>
    )
}
