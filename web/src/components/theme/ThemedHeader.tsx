import classNames from "classnames"
import type { ReactNode } from "react"

export interface ThemedHeaderProps {
    readonly className?: string
    readonly supplementaryStart?: ReactNode
    readonly supplementaryEnd?: ReactNode
    readonly children?: ReactNode
}

export default function ThemedHeader({
    className,
    supplementaryStart,
    supplementaryEnd,
    children,
}: ThemedHeaderProps) {
    return (
        <header
            className={classNames(
                "shrink-0 sticky left-0 top-0 isolate bg-linear-to-b from-primary/50 to-transparent text-sm font-semibold flex items-center gap-lg p-lg h-header z-40",
                className,
            )}
        >
            <div className="absolute inset-x-0 top-0 -bottom-full backdrop-blur-lg mask-[linear-gradient(to_bottom,black,transparent)] pointer-events-none -z-10" />
            {supplementaryStart}
            <div className="flex-1 flex items-center gap-lg">{children}</div>
            {supplementaryEnd}
        </header>
    )
}
