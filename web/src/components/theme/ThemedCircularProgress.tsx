import classNames from "classnames"

export interface ThemedCircularProgressProps {
    readonly containerClassName?: string
    readonly trackClassName?: string
    readonly progressClassName?: string
    readonly strokeWidth?: string
    readonly min?: number
    readonly max?: number
    readonly current: number
}

export default function ThemedCircularProgress({
    containerClassName = "size-4",
    trackClassName = "stroke-quaternary",
    progressClassName = "stroke-key",
    strokeWidth = "4",
    min = 0,
    max = 1,
    current,
}: ThemedCircularProgressProps) {
    const range = max - min
    const fraction = range > 0 ? Math.min(1, Math.max(0, (current - min) / range)) : 0
    return (
        <svg
            viewBox="0 0 32 32"
            className={classNames("-rotate-90", containerClassName)}
            role="progressbar"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={current}
        >
            {/* Track */}
            <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="none"
                strokeWidth={strokeWidth}
                className={trackClassName}
            />
            {/* Progress arc */}
            <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="none"
                strokeWidth={strokeWidth}
                pathLength={100}
                strokeDasharray={`${fraction * 100} 100`}
                className={progressClassName}
            />
        </svg>
    )
}
