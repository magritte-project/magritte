import { DismissContext, type Dismiss } from "@/contexts/dismissContext"
import { useRouter } from "@tanstack/react-router"
import { useContext } from "react"

export default function useDismiss(): Dismiss {
    const router = useRouter()
    const dismiss = useContext(DismissContext)
    if (dismiss !== undefined) {
        return dismiss
    } else {
        return () => {
            router.history.back()
        }
    }
}
