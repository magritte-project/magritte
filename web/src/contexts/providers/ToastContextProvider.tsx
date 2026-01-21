import type { ReactNode } from "react"

import { ToastContext, type ToastContextType } from "@/contexts/toastContext"

export interface ToastContextProviderProps {
    readonly value: ToastContextType
    readonly children?: ReactNode
}

export default function ToastContextProvider({ value, children }: ToastContextProviderProps) {
    return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}
