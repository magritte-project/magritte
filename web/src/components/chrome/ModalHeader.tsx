import useDismiss from "@/hooks/dismissHook"
import { XIcon } from "@phosphor-icons/react"
import type { ReactNode } from "react"

export interface ModalHeaderProps {
    readonly children?: ReactNode
}

export default function ModalHeader({ children }: ModalHeaderProps) {
    const dismiss = useDismiss()
    return (
        <header className="sticky top-0 bg-white/99 z-50 flex items-center gap-2 p-2">
            <button type="button" onClick={dismiss} className="cursor-pointer">
                <XIcon weight="bold" aria-label="Close" />
            </button>
            <div className="flex-1 flex items-center justify-center gap-2">
                {children}
            </div>
        </header>
    )
}
