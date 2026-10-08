/** Join the non-empty parts of a description with a separator */
export function joinDetails(...parts: readonly (string | null | undefined)[]): string {
    return parts.filter(Boolean).join(" · ")
}

const compactNumber = new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
})

/** Describe a view or subscriber count the way YouTube labels one, e.g. `1.2M views` */
export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
    return `${compactNumber.format(count)} ${count === 1 ? singular : plural}`
}

/** A duration as `m:ss`, or `h:mm:ss` past an hour */
export function formatDuration(seconds: number): string {
    const totalSeconds = Math.round(seconds)
    const pad = (value: number) => String(value).padStart(2, "0")
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor(totalSeconds / 60) % 60
    return hours > 0
        ? `${hours}:${pad(minutes)}:${pad(totalSeconds % 60)}`
        : `${minutes}:${pad(totalSeconds % 60)}`
}

const mediumDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" })

/** The day of an ISO 8601 timestamp, e.g. `Sep 24, 1991` */
export function formatDate(timestamp: string | null | undefined): string | undefined {
    const date = new Date(timestamp ?? "")
    return Number.isNaN(date.getTime()) ? undefined : mediumDate.format(date)
}
