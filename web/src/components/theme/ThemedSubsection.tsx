import classNames from "classnames"
import type { ReactNode } from "react"

export interface ThemedSubsectionProps {
    readonly className?: string
    readonly children?: ReactNode
}

export default function ThemedSubsection({ className, children }: ThemedSubsectionProps) {
    return (
        <h2
            className={classNames(
                "text-xl font-bold mt-lg pb-sm border-b border-quaternary",
                className,
            )}
        >
            {children}
        </h2>
    )
}
