import type { ExternalLinks, TrackMatch } from "@/model/types"

export interface LinkedEntityQuery {
    readonly data?: { readonly links: ExternalLinks } | null
    readonly isLoading: boolean
}

/**
 * The links a now-playing section can offer, folding in whether the match and
 * the entity behind it are still on their way. `undefined` means wait,
 * `null` means there is nothing to wait for.
 */
export function linksFromMatch(
    match: TrackMatch | null | undefined,
    matched: boolean,
    query: LinkedEntityQuery,
): ExternalLinks | null | undefined {
    if (match === undefined) {
        return undefined
    }
    if (match === null || !matched) {
        return null
    }
    if (query.data) {
        return query.data.links
    }
    return query.isLoading ? undefined : null
}
