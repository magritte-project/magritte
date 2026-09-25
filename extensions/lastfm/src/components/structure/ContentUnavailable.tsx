import { CircleNotchIcon, WarningCircleIcon } from "@phosphor-icons/react"
import classNames from "classnames"

const variants = {
    fullScreen: {
        containerClassName: "p-4 min-h-0 h-screen",
    },
    inline: {
        containerClassName: "p-4",
    },
} as const

export type ContentUnavailableVariant = keyof typeof variants

export interface ContentUnavailableProps {
    readonly variant?: ContentUnavailableVariant
    readonly className?: string
    readonly error?: unknown
}

export default function ContentUnavailable({
    variant = "fullScreen",
    className,
    error,
}: ContentUnavailableProps) {
    const { containerClassName } = variants[variant]
    return (
        <div
            className={classNames(
                "flex flex-col text-center items-center justify-center gap-2",
                containerClassName,
                className,
            )}
        >
            {error ? (
                <>
                    <WarningCircleIcon size="3em" weight="light" />
                    <div className="text-lg font-bold">Something went wrong</div>
                    <div className="text-sm">
                        {error instanceof Error ? error.message : String(error)}
                    </div>
                </>
            ) : (
                <CircleNotchIcon className="animate-spin" size="3em" weight="light" color="gray" />
            )}
        </div>
    )
}
