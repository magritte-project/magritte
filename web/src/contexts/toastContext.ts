import { createContext } from "react"

export type ToastType = "success" | "error" | "info"

export interface Toast {
    readonly message: string
    readonly type: ToastType
}

export interface ToastContextType {
    showToast: (toast: Toast) => void
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)
