import { AnimatePresence } from "motion/react"
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"

import type { Toast } from "@/contexts/toastContext"

import ToastNotification from "@/components/chrome/ToastNotification"
import ToastContextProvider from "@/contexts/providers/ToastContextProvider"

export interface ToastLayoutProps {
    readonly children?: ReactNode
}

export default function ToastLayout({ children }: ToastLayoutProps) {
    const [toasts, setToasts] = useState<readonly Toast[]>([])
    useEffect(() => {
        if (toasts.length === 0) {
            return
        }
        const timeout = setTimeout(() => {
            setToasts((toasts) => toasts.slice(1))
        }, 3000)
        return () => clearTimeout(timeout)
    }, [toasts])
    const showToast = useCallback((toast: Toast) => {
        setToasts((toasts) => [...toasts, toast])
    }, [])
    const presentedToast = useMemo(() => {
        return toasts.length > 0 ? toasts[0] : null
    }, [toasts])
    return (
        <>
            <ToastContextProvider value={{ showToast }}>{children}</ToastContextProvider>
            <AnimatePresence>
                {presentedToast && (
                    <ToastNotification
                        className="fixed bottom-4 left-1/2 -translate-1/2 max-w-lg"
                        {...presentedToast}
                    />
                )}
            </AnimatePresence>
        </>
    )
}
