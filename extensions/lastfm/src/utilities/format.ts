/** Join the non-empty parts of a description with a separator */
export function joinDetails(...parts: readonly (string | null | undefined)[]): string {
    return parts.filter(Boolean).join(" · ")
}

const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })

const RELATIVE_UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
    ["second", 60],
    ["minute", 60],
    ["hour", 24],
    ["day", 7],
    ["week", 4.35],
    ["month", 12],
]

/**
 * Describe when something happened relative to now, e.g. `5 minutes ago`.
 *
 * @param timestamp Unix time in seconds, as Last.fm reports it.
 */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
    let value = (timestamp * 1000 - now) / 1000
    for (const [unit, limit] of RELATIVE_UNITS) {
        if (Math.abs(value) < limit) {
            return relativeTime.format(Math.round(value), unit)
        }
        value /= limit
    }
    return relativeTime.format(Math.round(value), "year")
}

/** Describe a play count the way Last.fm labels one */
export function formatPlayCount(playCount: number): string {
    return `${playCount.toLocaleString()} ${playCount === 1 ? "play" : "plays"}`
}
