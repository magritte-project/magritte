import { useContext } from "react"

import { ToastContext, type ToastContextType } from "@/contexts/toastContext"

export type UseToastResult = ToastContextType

export default function useToast(): UseToastResult {
    const toast = useContext(ToastContext)
    if (toast === undefined) {
        throw new Error("useToast() used outside of <ToastContextProvider>")
    }
    return toast
}
