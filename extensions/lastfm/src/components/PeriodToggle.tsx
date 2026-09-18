import classNames from "classnames"

import type { TopTracksPeriod } from "@/lastfm/client"

const PERIODS: readonly (readonly [TopTracksPeriod, string])[] = [
    ["7day", "Week"],
    ["1month", "Month"],
]

export interface PeriodToggleProps {
    readonly period: TopTracksPeriod
    readonly onChange: (period: TopTracksPeriod) => void
}

export default function PeriodToggle({ period, onChange }: PeriodToggleProps) {
    return (
        <div
            className="flex shrink-0 items-center gap-0.5 rounded-md bg-black/5 p-0.5"
            role="group"
            aria-label="Top tracks period"
        >
            {PERIODS.map(([value, label]) => (
                <button
                    key={value}
                    type="button"
                    className={classNames(
                        "rounded-[5px] px-2 py-0.5 text-xs font-semibold",
                        value === period
                            ? "bg-white text-gray-950 shadow-sm"
                            : "text-gray-600 hover:text-gray-950",
                    )}
                    aria-pressed={value === period}
                    onClick={() => onChange(value)}
                >
                    {label}
                </button>
            ))}
        </div>
    )
}
