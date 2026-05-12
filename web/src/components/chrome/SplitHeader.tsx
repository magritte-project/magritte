import { XIcon } from "@phosphor-icons/react"
import type { ReactNode } from "react"

import ThemedHeader from "@/components/theme/ThemedHeader"
import ThemedSubtleButton from "@/components/theme/ThemedSubtleButton"
import useDismiss from "@/hooks/dismissHook"

export interface SplitHeaderProps {
    readonly title: ReactNode
}

export default function SplitHeader({ title }: SplitHeaderProps) {
    const dismiss = useDismiss()
    return (
        <ThemedHeader
            supplementaryStart={
                <ThemedSubtleButton type="button" onClick={dismiss}>
                    <XIcon />
                </ThemedSubtleButton>
            }
        >
            {title}
        </ThemedHeader>
    )
}
