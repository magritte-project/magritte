import classNames from "classnames"
import type { ReactNode } from "react"

export interface ThemedLargeTitleSubheaderProps {
    readonly className?: string
    readonly supplementaryEnd?: ReactNode
    readonly caption?: ReactNode
    readonly children?: ReactNode
}

export default function ThemedLargeTitleSubheader({
    className,
    supplementaryEnd,
    caption,
    children,
}: ThemedLargeTitleSubheaderProps) {
    return (
        <h1 className={classNames("flex items-center gap-lg", className)}>
            <div className="flex-1 flex flex-col">
                <div className="text-2xl font-bold">{children}</div>
                {caption && <div className="text-sm">{caption}</div>}
            </div>
            {supplementaryEnd}
        </h1>
    )
}
