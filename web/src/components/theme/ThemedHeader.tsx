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
        <header className="sticky top-0 bg-white/95 text-sm font-semibold flex items-center gap-4 p-2 z-40 overflow-x-auto">
            {supplementaryStart}
            <div className="flex-1 flex items-center justify-center gap-4">
                {children}
            </div>
            {supplementaryEnd}
        </header>
    )
}
