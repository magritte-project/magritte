import type { ToastOptions } from "@magritte/sdk"
import { createContext } from "react"

export interface ToastContextType {
    showToast: (toast: ToastOptions) => void
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)
