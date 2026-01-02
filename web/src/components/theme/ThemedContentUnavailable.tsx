import type { ReactNode } from "react"

import { CircleNotchIcon, WarningCircleIcon } from "@phosphor-icons/react"

import ThemedButton from "./ThemedButton"

export interface ThemedContentUnavailableProps {
    readonly error?: unknown
    readonly onRetry?: () => void
    readonly retryLabel?: ReactNode
}

export default function ThemedContentUnavailable({
    error,
    onRetry,
    retryLabel = "Retry",
}: ThemedContentUnavailableProps) {
    return (
        <div className="flex flex-col text-center items-center justify-center gap-2 p-4 min-h-0 h-screen">
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
