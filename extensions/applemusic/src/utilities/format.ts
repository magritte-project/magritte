/** Join the non-empty parts of a description with a separator */
export function joinDetails(...parts: readonly (string | null | undefined)[]): string {
    return parts.filter(Boolean).join(" · ")
}

/** Extract the year from a `YYYY-MM-DD` or `YYYY` release date */
export function formatYear(releaseDate: string | null | undefined): string | undefined {
    return releaseDate?.slice(0, 4)
}
