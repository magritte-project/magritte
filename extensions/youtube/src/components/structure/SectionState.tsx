import { CircleNotchIcon, InfoIcon, WarningCircleIcon } from "@phosphor-icons/react"
import classNames from "classnames"

export interface SectionStateProps {
    readonly status: "pending" | "error" | "empty"
    readonly message?: string
    readonly error?: unknown
    readonly className?: string
}

/** A one-line state for part of a page, so one failing source never blanks the rest */
export default function SectionState({ status, message, error, className }: SectionStateProps) {
    const Icon =
        status === "pending" ? CircleNotchIcon : status === "error" ? WarningCircleIcon : InfoIcon
    const text =
        message ??
        (status === "pending"
            ? "Loading…"
            : status === "error"
              ? error instanceof Error
                  ? error.message
                  : "Something went wrong"
              : "Nothing here")
    return (
        <div
            className={classNames(
                "flex items-center gap-2 px-3 py-2 text-xs text-gray-500",
                className,
            )}
        >
            <Icon
                className={classNames("shrink-0", status === "pending" && "animate-spin")}
                aria-hidden
            />
            <span className="min-w-0">{text}</span>
        </div>
    )
}
