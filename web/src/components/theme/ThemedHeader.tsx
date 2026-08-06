import type { ReactNode } from "react"

export interface ThemedHeaderProps {
    readonly supplementaryStart?: ReactNode
    readonly supplementaryEnd?: ReactNode
    readonly children?: ReactNode
}

export default function ThemedHeader({
    supplementaryStart,
    supplementaryEnd,
    children,
}: ThemedHeaderProps) {
    return (
        <header className="shrink-0 sticky top-0 bg-primary/95 text-sm font-semibold flex items-center gap-between p-outside z-40 overflow-x-auto">
            {supplementaryStart}
            <div className="flex-1 flex items-center gap-between">{children}</div>
            {supplementaryEnd}
        </header>
    )
}
