import useDismiss from "@/hooks/dismissHook"
import { CaretLeftIcon } from "@phosphor-icons/react"
import type { ReactNode } from "react"
import ThemedHeader from "@/components/theme/ThemedHeader"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"

export interface ModalHeaderProps {
    readonly children?: ReactNode
}

export default function ModalHeader({ children }: ModalHeaderProps) {
    const dismiss = useDismiss()
    return (
        <ThemedHeader
            supplementaryStart={
                <ThemedSubtleButton onClick={dismiss}>
                    <CaretLeftIcon weight="bold" aria-label="Dismiss" />
                </ThemedSubtleButton>
            }
        >
            {children}
        </ThemedHeader>
    )
}
