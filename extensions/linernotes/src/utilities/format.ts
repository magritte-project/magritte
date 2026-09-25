/** Join the non-empty parts of a description with a separator */
export function joinDetails(...parts: readonly (string | null | undefined)[]): string {
    return parts.filter(Boolean).join(" · ")
}

/** Describe a play or listener count the way Last.fm labels one */
export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
    return `${count.toLocaleString()} ${count === 1 ? singular : plural}`
}

/** A duration as `m:ss`, or `h:mm:ss` past an hour */
export function formatDuration(milliseconds: number): string {
    const totalSeconds = Math.round(milliseconds / 1000)
    const seconds = totalSeconds % 60
    const minutes = Math.floor(totalSeconds / 60) % 60
    const hours = Math.floor(totalSeconds / 3600)
    const pad = (value: number) => String(value).padStart(2, "0")
    return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`
}

/** The year of a partial ISO date such as `1991-09-24` or `1991` */
export function formatYear(date: string | null | undefined): string | undefined {
    const match = /^(\d{4})/.exec(date ?? "")
    return match?.[1]
}

/** A span of years such as `1987–1994` or `1987–present` */
export function formatYears(
    begin: string | undefined,
    end: string | undefined,
    ended: boolean,
): string | undefined {
    const beginYear = formatYear(begin)
    const endYear = formatYear(end)
    if (beginYear === undefined && endYear === undefined) {
        return undefined
    }
    if (!ended && endYear === undefined) {
        return beginYear !== undefined ? `${beginYear}–present` : undefined
    }
    if (beginYear === endYear || beginYear === undefined) {
        return endYear ?? beginYear
    }
    return `${beginYear}–${endYear ?? ""}`
}

/** Sentence-case a MusicBrainz relationship type or attribute */
export function capitalize(value: string): string {
    return value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value
}
