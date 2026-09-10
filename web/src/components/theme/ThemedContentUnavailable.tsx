import { CircleNotchIcon, WarningCircleIcon } from "@phosphor-icons/react"
import classNames from "classnames"
import type { ReactNode } from "react"

import ThemedButton from "@/components/theme/ThemedButton"

const variants = {
    fullScreen: {
        containerClassName: "p-4 min-h-0 h-screen",
    },
    inline: {
        containerClassName: "p-4",
    },
} as const

export type ThemedContentUnavailableVariant = keyof typeof variants

export interface ThemedContentUnavailableProps extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "children"
> {
    readonly variant?: ThemedContentUnavailableVariant
    readonly className?: string
    readonly error?: unknown
    readonly onRetry?: () => void
    readonly retryLabel?: ReactNode
}

export default function ThemedContentUnavailable({
    variant = "fullScreen",
    className,
    error,
    onRetry,
    retryLabel = "Retry",
    ...rest
}: ThemedContentUnavailableProps) {
    const { containerClassName } = variants[variant]
    return (
        <div
            className={classNames(
                "flex flex-col text-center items-center justify-center gap-between",
                containerClassName,
                className,
            )}
            {...rest}
        >
            {error ? (
                <>
                    <WarningCircleIcon size="3em" weight="light" />
                    <div className="text-lg font-bold">Something went wrong</div>
                    <div className="text-sm">
                        {error instanceof Error ? error.message : String(error)}
                    </div>
                    {onRetry && <ThemedButton onClick={onRetry}>{retryLabel}</ThemedButton>}
                </>
            ) : (
                <CircleNotchIcon className="animate-spin" size="3em" weight="light" color="gray" />
            )}
        </div>
    )
}
