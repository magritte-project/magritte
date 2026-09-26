import { CircleNotchIcon, WarningCircleIcon } from "@phosphor-icons/react"
import classNames from "classnames"

import "@/components/reusable/ContentUnavailable.css"

const variants = {
    fullScreen: {
        containerClassName: "content-unavailable--full-screen",
    },
    inline: {
        containerClassName: undefined,
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
        <div className={classNames("content-unavailable", containerClassName, className)}>
            {error ? (
                <>
                    <WarningCircleIcon size="3em" weight="light" />
                    <div className="content-unavailable__title">Something went wrong</div>
                    <div className="content-unavailable__message">
                        {error instanceof Error ? error.message : String(error)}
                    </div>
                </>
            ) : (
                <CircleNotchIcon
                    className="content-unavailable__spinner"
                    size="3em"
                    weight="light"
                    color="gray"
                />
            )}
        </div>
    )
}
