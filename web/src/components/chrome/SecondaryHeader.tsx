import type { ReactNode } from "react"

import ThemedHeader from "@/components/theme/ThemedHeader"

export interface SecondaryHeaderProps {
    readonly children?: ReactNode
}

export default function SecondaryHeader({ children }: SecondaryHeaderProps) {
    return <ThemedHeader>{children}</ThemedHeader>
}
