import { CaretLeftIcon } from "@phosphor-icons/react"
import type { ReactNode } from "react"

import ThemedHeader from "@/components/theme/ThemedHeader"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useDismiss from "@/hooks/dismissHook"

export interface ModalHeaderProps {
    readonly supplementaryStart?: ReactNode
    readonly supplementaryEnd?: ReactNode
    readonly children?: ReactNode
}

export default function ModalHeader({
    supplementaryStart,
    supplementaryEnd,
    children,
}: ModalHeaderProps) {
    const dismiss = useDismiss()
    return (
        <ThemedHeader
            supplementaryStart={
                <>
                    <ThemedSubtleButton onClick={dismiss} title="Dismiss">
                        <CaretLeftIcon weight="bold" />
                    </ThemedSubtleButton>
                    {supplementaryStart}
                </>
            }
            supplementaryEnd={supplementaryEnd}
        >
            {children}
        </ThemedHeader>
    )
}
